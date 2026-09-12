"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LANG, detectLang, getStrings, type Strings } from "./strings";
import { isLang, LANG_META, type Lang } from "./types";

const KEY = "lx-lang-v1";

type LangValue = { lang: Lang; setLang: (l: Lang) => void; t: Strings; ready: boolean };

const LangContext = createContext<LangValue>({
  lang: DEFAULT_LANG,
  setLang: () => {},
  t: getStrings(DEFAULT_LANG),
  ready: false,
});

/** Reads the stored choice, falls back to the browser's languages. */
export function storedLang(): Lang {
  if (typeof window === "undefined") return DEFAULT_LANG;
  try {
    const saved = localStorage.getItem(KEY);
    if (isLang(saved)) return saved;
  } catch {
    /* private mode */
  }
  return detectLang(navigator.languages ?? [navigator.language]);
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initial = storedLang();
    setLangState(initial);
    setReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.lang = LANG_META[lang].htmlLang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* private mode */
    }
  }, []);

  const value = useMemo<LangValue>(
    () => ({ lang, setLang, t: getStrings(lang), ready }),
    [lang, setLang, ready],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangValue {
  return useContext(LangContext);
}
