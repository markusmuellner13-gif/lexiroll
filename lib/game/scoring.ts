import type { Answers, Category, GameSettings, RoundResult, ScoredAnswer } from "./types";

export const POINTS = { solo: 20, unique: 10, duplicate: 5, invalid: 0 } as const;

/** Fold umlauts so "Köln" and "Koeln" are the same answer. */
export function foldWord(word: string): string {
  return word
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]/g, "");
}

/** Ä counts for A, Ö for O, Ü for U - the way everyone plays it at the kitchen table. */
export function startsWithLetter(word: string, letter: string): boolean {
  const first = word.trim().charAt(0).toLowerCase();
  const target = letter.toLowerCase();
  const folded = first === "ä" ? "a" : first === "ö" ? "o" : first === "ü" ? "u" : first;
  return folded === target;
}

export function isFormallyValid(word: string, letter: string): boolean {
  const w = word.trim();
  return w.length >= 2 && startsWithLetter(w, letter);
}

export type VetoMap = Record<string, boolean>; // `${playerId}:${categoryId}` -> struck out

export function vetoKey(playerId: string, categoryId: string) {
  return `${playerId}:${categoryId}`;
}

/**
 * Classic Stadt-Land-Fluss scoring:
 *   20 - the only player with a valid answer in that category
 *   10 - valid and nobody else wrote the same word
 *    5 - valid but shared with someone else
 *    0 - empty, wrong letter, or struck out in the review phase
 */
export function scoreRound(
  letter: string,
  categories: Category[],
  playerIds: string[],
  answersByPlayer: Record<string, Answers>,
  settings: GameSettings,
  vetoes: VetoMap = {},
): RoundResult {
  const scored: ScoredAnswer[] = [];
  const totals: Record<string, number> = Object.fromEntries(playerIds.map((id) => [id, 0]));

  for (const category of categories) {
    const entries = playerIds.map((playerId) => {
      const raw = (answersByPlayer[playerId]?.[category.id] ?? "").trim();
      const vetoed = !!vetoes[vetoKey(playerId, category.id)];
      const valid = raw.length > 0 && isFormallyValid(raw, letter) && !vetoed;
      return { playerId, raw, vetoed, valid, folded: foldWord(raw) };
    });

    const valid = entries.filter((e) => e.valid);
    const counts = new Map<string, number>();
    for (const e of valid) counts.set(e.folded, (counts.get(e.folded) ?? 0) + 1);

    for (const e of entries) {
      let points = 0;
      let status: ScoredAnswer["status"];
      if (!e.raw) {
        status = "empty";
      } else if (!e.valid) {
        status = "invalid";
      } else if (valid.length === 1 && playerIds.length > 1 && settings.soloBonus) {
        status = "solo";
        points = POINTS.solo;
      } else if ((counts.get(e.folded) ?? 0) > 1) {
        status = "duplicate";
        points = POINTS.duplicate;
      } else {
        status = "unique";
        points = POINTS.unique;
      }
      totals[e.playerId] += points;
      scored.push({
        playerId: e.playerId,
        categoryId: category.id,
        word: e.raw,
        points,
        status,
        vetoed: e.vetoed,
      });
    }
  }

  return { letter, answers: scored, totals };
}

export function statusLabel(status: ScoredAnswer["status"]): string {
  switch (status) {
    case "solo":
      return "Einzelkämpfer";
    case "unique":
      return "Einzigartig";
    case "duplicate":
      return "Doppelt";
    case "invalid":
      return "Ungültig";
    default:
      return "Leer";
  }
}
