export const LANGS = ["de", "en", "it"] as const;
export type Lang = (typeof LANGS)[number];

export const LANG_META: Record<Lang, { label: string; flag: string; htmlLang: string }> = {
  de: { label: "Deutsch", flag: "🇩🇪", htmlLang: "de" },
  en: { label: "English", flag: "🇬🇧", htmlLang: "en" },
  it: { label: "Italiano", flag: "🇮🇹", htmlLang: "it" },
};

export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && (LANGS as readonly string[]).includes(value);
}

/** Server-side failures travel as codes so every client can phrase them itself. */
export type ErrorCode =
  | "NO_DB"
  | "ROOM_NOT_FOUND"
  | "ROOM_EXPIRED"
  | "ROOM_FULL"
  | "GAME_RUNNING"
  | "ROUND_RUNNING"
  | "NOT_IN_ROOM"
  | "HOST_ONLY"
  | "LOBBY_ONLY"
  | "NO_BOTS_LEFT"
  | "CANT_KICK_HOST"
  | "NEED_PLAYERS"
  | "GAME_OVER"
  | "NO_OWN_VETO"
  | "CODE_FAILED"
  | "NO_CONNECTION"
  | "GENERIC";
