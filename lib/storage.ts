"use client";

import { defaultCategories } from "./game/categories";
import { defaultSettings } from "./game/defaults";
import { hardLetters } from "./game/letters";
import type { Category, GameSettings } from "./game/types";
import { isLang, type Lang } from "./i18n/types";

const SETTINGS_KEY = "lx-settings-v1";
const PROFILE_KEY = "lx-profile-v1";
const STATS_KEY = "lx-stats-v1";
const BANK_CACHE_KEY = "lx-banks-v1";

export type Profile = { id: string; name: string; emoji: string };

export const AVATARS = ["🦊", "🐼", "🐙", "🦉", "🐝", "🦄", "🐸", "🦁", "🐧", "🐨", "🦜", "🐳"];

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode, quota - not worth breaking the game over */
  }
}

function sameSlugs(categories: Category[], reference: Category[]): boolean {
  if (categories.length !== reference.length) return false;
  return categories.every((c, i) => c.bank === reference[i].bank);
}

/**
 * Moves settings to another language. Untouched defaults follow along; a
 * player's own category list is left exactly as they built it.
 */
export function retargetSettings(settings: GameSettings, lang: Lang): GameSettings {
  if (settings.lang === lang) return settings;
  const wasDefault = sameSlugs(settings.categories, defaultCategories(settings.lang));
  const hadDefaultLetters =
    [...settings.excludedLetters].sort().join("") === [...hardLetters(settings.lang)].sort().join("");
  return {
    ...settings,
    lang,
    categories: wasDefault ? defaultCategories(lang) : settings.categories,
    excludedLetters: hadDefaultLetters ? hardLetters(lang) : settings.excludedLetters,
  };
}

export function loadSettings(lang: Lang): GameSettings {
  const base = defaultSettings(lang);
  const stored = read<Partial<GameSettings>>(SETTINGS_KEY);
  if (!stored) return base;

  const categories =
    Array.isArray(stored.categories) && stored.categories.length
      ? (stored.categories as Category[])
      : base.categories;
  const merged: GameSettings = {
    ...base,
    ...stored,
    lang: isLang(stored.lang) ? stored.lang : lang,
    categories,
  };
  // Without a clock, Stop is the only thing that can end a round.
  if (merged.roundSeconds === 0) merged.allowStop = true;
  return retargetSettings(merged, lang);
}

export function saveSettings(settings: GameSettings) {
  write(SETTINGS_KEY, settings);
}

export function loadProfile(): Profile {
  const stored = read<Profile>(PROFILE_KEY);
  if (stored?.id) return stored;
  const created: Profile = {
    id: crypto.randomUUID(),
    name: "",
    emoji: AVATARS[Math.floor(Math.random() * AVATARS.length)],
  };
  write(PROFILE_KEY, created);
  return created;
}

export function saveProfile(profile: Profile) {
  write(PROFILE_KEY, profile);
}

export type Stats = { games: number; wins: number; bestRound: number; totalPoints: number };

export function loadStats(): Stats {
  return read<Stats>(STATS_KEY) ?? { games: 0, wins: 0, bestRound: 0, totalPoints: 0 };
}

export function recordGame(won: boolean, points: number, bestRound: number) {
  const s = loadStats();
  write(STATS_KEY, {
    games: s.games + 1,
    wins: s.wins + (won ? 1 : 0),
    bestRound: Math.max(s.bestRound, bestRound),
    totalPoints: s.totalPoints + points,
  });
}

/** Generated word banks, cached per browser so we only ask for each one once. */
type BankCache = Record<string, Record<string, Record<string, string[]>>>; // lang -> key -> letter -> words

export function loadCachedBanks(): BankCache {
  return read<BankCache>(BANK_CACHE_KEY) ?? {};
}

export function cacheBank(lang: Lang, key: string, bank: Record<string, string[]>) {
  const all = loadCachedBanks();
  (all[lang] ??= {})[key] = bank;
  write(BANK_CACHE_KEY, all);
}
