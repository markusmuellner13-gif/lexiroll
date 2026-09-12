"use client";

import { DEFAULT_CATEGORIES } from "./game/categories";
import { DEFAULT_SETTINGS, type Category, type GameSettings } from "./game/types";

const SETTINGS_KEY = "wj-settings-v1";
const PROFILE_KEY = "wj-profile-v1";
const STATS_KEY = "wj-stats-v1";

export type Profile = { id: string; name: string; emoji: string };

export const AVATARS = ["🦊", "🐼", "🐙", "🦉", "🐝", "🦄", "🐸", "🦁", "🐧", "🐨", "🦜", "🐳"];

export function defaultSettings(): GameSettings {
  return { ...DEFAULT_SETTINGS, categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })) };
}

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

export function loadSettings(): GameSettings {
  const stored = read<Partial<GameSettings>>(SETTINGS_KEY);
  const base = defaultSettings();
  if (!stored) return base;
  const categories = Array.isArray(stored.categories) && stored.categories.length
    ? (stored.categories as Category[])
    : base.categories;
  const merged = { ...base, ...stored, categories };
  // Without a clock, Stopp is the only thing that can end a round.
  if (merged.roundSeconds === 0) merged.allowStop = true;
  return merged;
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

/** Word banks the generator produced, kept per browser so we only ask once. */
const BANK_CACHE_KEY = "wj-banks-v1";

export function loadCachedBanks(): Record<string, Record<string, string[]>> {
  return read<Record<string, Record<string, string[]>>>(BANK_CACHE_KEY) ?? {};
}

export function cacheBank(key: string, bank: Record<string, string[]>) {
  const all = loadCachedBanks();
  all[key] = bank;
  write(BANK_CACHE_KEY, all);
}
