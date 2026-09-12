import type { Lang } from "../i18n/types";
import { defaultCategories } from "./categories";
import { hardLetters } from "./letters";
import type { GameSettings } from "./types";

export function defaultSettings(lang: Lang): GameSettings {
  return {
    lang,
    categories: defaultCategories(lang),
    rounds: 5,
    roundSeconds: 120,
    allowStop: true,
    excludedLetters: hardLetters(lang),
    soloBonus: true,
    botDifficulty: "normal",
  };
}
