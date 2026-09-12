import type { Lang } from "../i18n/types";
import { LANGS } from "../i18n/types";
import { deBanks } from "./banks/de";
import { enBanks } from "./banks/en";
import { itBanks } from "./banks/it";

/**
 * Word banks the bots answer from, one set per language.
 *
 * Bank keys are language-neutral slugs ("city", "animal"), so the same category
 * resolves everywhere while the words themselves stay native.
 */
const RAW: Record<Lang, Record<string, string>> = {
  de: deBanks,
  en: enBanks,
  it: itBanks,
};

const cache = new Map<string, Record<string, string[]>>();

/** Banks produced at runtime for invented categories. */
const runtimeBanks = new Map<string, Record<string, string[]>>();

function slot(lang: Lang, key: string) {
  return `${lang}:${key}`;
}

function parse(raw: string): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const group of raw.split(";")) {
    const idx = group.indexOf(":");
    if (idx < 0) continue;
    const letter = group.slice(0, idx).trim().toUpperCase();
    out[letter] = group
      .slice(idx + 1)
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean);
  }
  return out;
}

export function getBank(lang: Lang, key: string): Record<string, string[]> | null {
  const id = slot(lang, key);
  if (runtimeBanks.has(id)) return runtimeBanks.get(id)!;
  if (cache.has(id)) return cache.get(id)!;
  const raw = RAW[lang]?.[key];
  if (!raw) return null;
  const parsed = parse(raw);
  cache.set(id, parsed);
  return parsed;
}

/** Registers a bank produced at runtime (e.g. by the Claude API). */
export function registerBank(lang: Lang, key: string, words: Record<string, string[]>) {
  const normalized: Record<string, string[]> = {};
  for (const [letter, list] of Object.entries(words)) {
    normalized[letter.toUpperCase()] = list.map((w) => String(w).trim()).filter(Boolean);
  }
  runtimeBanks.set(slot(lang, key), normalized);
}

export function hasBank(lang: Lang, key: string | null | undefined): boolean {
  if (!key) return false;
  return !!RAW[lang]?.[key] || runtimeBanks.has(slot(lang, key));
}

/** Every built-in slug, minus the generic fallback pool. */
export const BANK_KEYS = Object.keys(deBanks).filter((k) => k !== "generic");

/**
 * Words for a letter in a bank.
 *
 * A gap inside a bank the language owns is a real gap - Italian simply has no
 * cities starting with H, and the bot should draw a blank rather than answer
 * "Hamburg" in an Italian game. Only a category this language does not know at
 * all (one set up by a player in another language) borrows from elsewhere.
 */
export function wordsFor(lang: Lang, bankKey: string | null | undefined, letter: string): string[] {
  if (!bankKey) return [];
  const bank = getBank(lang, bankKey);
  if (bank) return bank[letter.toUpperCase()] ?? [];

  for (const other of LANGS) {
    if (other === lang) continue;
    const fallback = getBank(other, bankKey)?.[letter.toUpperCase()];
    if (fallback?.length) return fallback;
  }
  return [];
}

export function genericWords(lang: Lang, letter: string): string[] {
  return getBank(lang, "generic")?.[letter.toUpperCase()] ?? [];
}
