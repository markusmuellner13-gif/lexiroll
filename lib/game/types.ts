import type { Lang } from "../i18n/types";

export type PlayerKind = "human" | "bot";

export type Player = {
  id: string;
  name: string;
  emoji: string;
  kind: PlayerKind;
  /** 0..1 - how often a bot finds a fitting word. */
  skill?: number;
  /** Bot pacing multiplier - lower is faster. */
  pace?: number;
  score: number;
  connected?: boolean;
  isHost?: boolean;
};

export type Category = {
  id: string;
  /** Label shown in the UI, e.g. "Stadt". */
  name: string;
  /** Resolved word-bank slug the bots use, or null if unknown. */
  bank?: string | null;
  custom?: boolean;
};

export type GameSettings = {
  /** Language of the categories and the bots' vocabulary. */
  lang: Lang;
  categories: Category[];
  rounds: number;
  /** Seconds per round. 0 = no limit (only "Stop" ends the round). */
  roundSeconds: number;
  /** Classic: first player to fill everything may stop the round for everyone. */
  allowStop: boolean;
  /** Letters that never come up. */
  excludedLetters: string[];
  /** 20 points if you are the only one with an answer in a category. */
  soloBonus: boolean;
  /** Bot difficulty. */
  botDifficulty: "chill" | "normal" | "brutal";
};

export type Answers = Record<string, string>; // categoryId -> word

export type ScoredAnswer = {
  playerId: string;
  categoryId: string;
  word: string;
  points: number;
  status: "unique" | "duplicate" | "solo" | "invalid" | "empty";
  /** Flagged invalid by other players in the review phase. */
  vetoed?: boolean;
};

export type RoundResult = {
  letter: string;
  answers: ScoredAnswer[];
  totals: Record<string, number>; // playerId -> points this round
};

export type Phase = "lobby" | "rolling" | "playing" | "voting" | "results" | "final";
