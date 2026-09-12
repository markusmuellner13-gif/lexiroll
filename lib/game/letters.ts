import type { Lang } from "../i18n/types";

export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/**
 * Letters worth throwing out, per language. Italian has no native J, K, W, X
 * or Y, and no common noun starts with H; German and English just find theirs
 * painful.
 */
export const HARD_LETTERS: Record<Lang, string[]> = {
  de: ["Q", "X", "Y", "C"],
  en: ["Q", "X", "Y", "Z"],
  it: ["H", "J", "K", "W", "X", "Y"],
};

export function hardLetters(lang: Lang): string[] {
  return HARD_LETTERS[lang] ?? HARD_LETTERS.de;
}

/**
 * Picks the letter for the next round. Letters already played in this game are
 * avoided until the pool runs dry, so no game repeats a letter needlessly.
 */
export function rollLetter(used: string[], excluded: string[] = [], rng = Math.random): string {
  const pool = ALPHABET.filter((l) => !excluded.includes(l));
  const usable = pool.length ? pool : ALPHABET;
  const fresh = usable.filter((l) => !used.includes(l));
  const from = fresh.length ? fresh : usable;
  return from[Math.floor(rng() * from.length)];
}

/** Frames for the dice animation: a shuffled run that ends on `final`. */
export function diceFrames(final: string, excluded: string[] = [], count = 16): string[] {
  const pool = ALPHABET.filter((l) => !excluded.includes(l) && l !== final);
  const usable = pool.length ? pool : ALPHABET.filter((l) => l !== final);
  const frames: string[] = [];
  for (let i = 0; i < count; i++) frames.push(usable[Math.floor(Math.random() * usable.length)]);
  frames.push(final);
  return frames;
}
