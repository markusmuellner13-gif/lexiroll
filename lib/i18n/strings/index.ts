import { de, type Strings } from "./de";
import { en } from "./en";
import { it } from "./it";
import { isLang, type Lang } from "../types";

export type { Strings };

export const STRINGS: Record<Lang, Strings> = { de, en, it };

export function getStrings(lang: Lang): Strings {
  return STRINGS[lang] ?? de;
}

export const DEFAULT_LANG: Lang = "en";

/** Picks the best supported language from a list of browser locales. */
export function detectLang(candidates: readonly string[]): Lang {
  for (const candidate of candidates) {
    const base = candidate.toLowerCase().split("-")[0];
    if (isLang(base)) return base;
  }
  return DEFAULT_LANG;
}
