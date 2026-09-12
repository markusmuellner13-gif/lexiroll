export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/** Letters that are painful in German and are excluded by default. */
export const HARD_LETTERS = ["Q", "X", "Y", "C"];

/**
 * Picks the letter for the next round. Letters already played in this game are
 * avoided until the pool runs dry, so no game repeats a letter needlessly.
 */
export function rollLetter(used: string[], excluded: string[] = HARD_LETTERS, rng = Math.random): string {
  const pool = ALPHABET.filter((l) => !excluded.includes(l));
  const fresh = pool.filter((l) => !used.includes(l));
  const from = fresh.length ? fresh : pool;
  return from[Math.floor(rng() * from.length)];
}

/** Frames for the dice animation: a shuffled run that ends on `final`. */
export function diceFrames(final: string, excluded: string[] = HARD_LETTERS, count = 16): string[] {
  const pool = ALPHABET.filter((l) => !excluded.includes(l) && l !== final);
  const frames: string[] = [];
  for (let i = 0; i < count; i++) frames.push(pool[Math.floor(Math.random() * pool.length)]);
  frames.push(final);
  return frames;
}
