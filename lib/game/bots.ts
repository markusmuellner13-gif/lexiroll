import type { Lang } from "../i18n/types";
import type { Category, GameSettings, Player } from "./types";
import { genericWords, wordsFor } from "./wordbank";

type BotArchetype = {
  /** Localized display names, keyed by language. */
  names: Record<Lang, string>;
  emoji: string;
  /** Multiplier on the difficulty skill. */
  smarts: number;
  /** Multiplier on how long it takes. Lower = faster. */
  pace: number;
};

/** Named bots with distinct feel, so a game against them has characters in it. */
const ARCHETYPES: BotArchetype[] = [
  { names: { de: "Blitz-Bernd", en: "Speedy Steve", it: "Lampo Luca" }, emoji: "⚡", smarts: 0.92, pace: 0.55 },
  { names: { de: "Grübel-Gabi", en: "Ponder Paula", it: "Pensa Piero" }, emoji: "🤔", smarts: 1.12, pace: 1.35 },
  { names: { de: "Klugscheißer-Klaus", en: "Know-it-all Ned", it: "Saputello Sandro" }, emoji: "🤓", smarts: 1.18, pace: 1.0 },
  { names: { de: "Chaos-Cem", en: "Chaos Charlie", it: "Caos Carla" }, emoji: "🌀", smarts: 0.72, pace: 0.75 },
  { names: { de: "Oma Ottilie", en: "Granny Gwen", it: "Nonna Nina" }, emoji: "🧶", smarts: 1.0, pace: 1.45 },
  { names: { de: "Turbo-Tina", en: "Turbo Tina", it: "Turbo Tina" }, emoji: "🏎️", smarts: 0.84, pace: 0.5 },
  { names: { de: "Lexi Lexikon", en: "Lexi Lexicon", it: "Lexi Lessico" }, emoji: "📚", smarts: 1.25, pace: 1.15 },
  { names: { de: "Faul-Fred", en: "Lazy Larry", it: "Pigro Pino" }, emoji: "😴", smarts: 0.6, pace: 1.6 },
  { names: { de: "Pixel-Pia", en: "Pixel Pete", it: "Pixel Pia" }, emoji: "👾", smarts: 0.95, pace: 0.85 },
  { names: { de: "Doktor Dodo", en: "Doctor Dodo", it: "Dottor Dodo" }, emoji: "🦤", smarts: 0.8, pace: 1.1 },
];

const DIFFICULTY = {
  chill: { skill: 0.5, speed: 1.5 },
  normal: { skill: 0.72, speed: 1.0 },
  brutal: { skill: 0.93, speed: 0.62 },
} as const;

export function makeBots(
  count: number,
  difficulty: GameSettings["botDifficulty"],
  lang: Lang,
): Player[] {
  const base = DIFFICULTY[difficulty];
  const pool = [...ARCHETYPES].sort(() => Math.random() - 0.5).slice(0, Math.max(0, count));
  return pool.map((a, i) => ({
    id: `bot-${i}-${a.names.en.toLowerCase().replace(/[^a-z]/g, "")}`,
    name: a.names[lang] ?? a.names.en,
    emoji: a.emoji,
    kind: "bot" as const,
    skill: clamp(base.skill * a.smarts, 0.15, 0.99),
    pace: clamp(base.speed * a.pace, 0.25, 2.5),
    score: 0,
  }));
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * Picks a word, biased towards the front of the list. The bias is what makes
 * bots collide with each other and with the player on obvious answers - which
 * is exactly where the 5-point duplicate rule gets interesting.
 */
function pickWeighted(words: string[]): string {
  if (words.length === 1) return words[0];
  const weights = words.map((_, i) => 1 / (i + 1.3));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < words.length; i++) {
    r -= weights[i];
    if (r <= 0) return words[i];
  }
  return words[words.length - 1];
}

export type BotFill = { categoryId: string; word: string; atMs: number };

export type BotPlan = {
  playerId: string;
  fills: BotFill[];
  /** Relative ms after round start when the bot is done thinking. */
  doneAtMs: number;
  /** Relative ms when the bot slams the Stop button, or null if it never will. */
  stopAtMs: number | null;
};

/**
 * Works out what a bot writes this round and when.
 *
 * Unknown categories (anything the player invented that has no word bank, and
 * that the generator could not fill either) fall back to the generic noun pool
 * with a heavy penalty - the bot takes a wild guess that humans can veto in the
 * review phase, exactly like a human bluffing.
 */
export function planBotRound(
  bot: Player,
  categories: Category[],
  letter: string,
  settings: GameSettings,
): BotPlan {
  const lang = settings.lang;
  const skill = bot.skill ?? 0.7;
  const pace = bot.pace ?? 1;
  const limitMs = (settings.roundSeconds > 0 ? settings.roundSeconds : 150) * 1000;

  const fills: BotFill[] = [];
  const used = new Set<string>();
  let cursor = 800 + Math.random() * 1200; // reaction time

  for (const category of categories) {
    const known = wordsFor(lang, category.bank, letter).filter((w) => !used.has(w.toLowerCase()));
    const isKnown = known.length > 0;
    const chance = isKnown ? skill : skill * 0.4;
    const thinkMs = (isKnown ? 2200 : 5200) * pace * (0.55 + Math.random());
    cursor += thinkMs;

    if (cursor > limitMs * 0.97) break; // ran out of time

    if (Math.random() > chance) continue; // drew a blank on this one

    const candidates = isKnown ? known : genericWords(lang, letter);
    if (!candidates.length) continue;
    const word = pickWeighted(candidates);
    used.add(word.toLowerCase());
    fills.push({ categoryId: category.id, word, atMs: Math.round(cursor) });
  }

  const doneAtMs = fills.length ? fills[fills.length - 1].atMs + 400 : Math.round(cursor);
  const filledAll = fills.length === categories.length;

  // Only a bot that got everything - and is feeling cocky - calls Stop.
  const stopAtMs =
    settings.allowStop && filledAll && Math.random() < 0.55 + skill * 0.35
      ? Math.min(doneAtMs + 300 + Math.random() * 900, limitMs - 500)
      : null;

  return {
    playerId: bot.id,
    fills,
    doneAtMs: Math.round(doneAtMs),
    stopAtMs: stopAtMs ? Math.round(stopAtMs) : null,
  };
}

/** The answers a bot has written down by `elapsedMs` into the round. */
export function answersAt(plan: BotPlan, elapsedMs: number): Record<string, string> {
  const out: Record<string, string> = {};
  for (const fill of plan.fills) {
    if (fill.atMs <= elapsedMs) out[fill.categoryId] = fill.word;
  }
  return out;
}

export function filledCountAt(plan: BotPlan, elapsedMs: number): number {
  return plan.fills.filter((f) => f.atMs <= elapsedMs).length;
}
