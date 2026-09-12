"use client";

import { useLang } from "@/lib/i18n/provider";
import { LANGS, LANG_META } from "@/lib/i18n/types";

/** Three flags, one tap. Small enough to live in any header. */
export function LangSwitch({ className = "" }: { className?: string }) {
  const { lang, setLang, t } = useLang();

  return (
    <div
      role="group"
      aria-label={t.common.language}
      className={`flex gap-1 rounded-full bg-white/8 p-1 ${className}`}
    >
      {LANGS.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          title={LANG_META[code].label}
          className={`grid h-8 w-8 place-items-center rounded-full text-base transition-all ${
            lang === code ? "scale-105 bg-lime/25 ring-1 ring-lime" : "opacity-55 hover:opacity-100"
          }`}
        >
          <span aria-hidden>{LANG_META[code].flag}</span>
          <span className="sr-only">{LANG_META[code].label}</span>
        </button>
      ))}
    </div>
  );
}
