"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n/provider";
import { LangSwitch } from "./LangSwitch";

export function RulesPage() {
  const { t } = useLang();

  return (
    <div className="shell max-w-2xl space-y-6 py-[calc(1.5rem+var(--safe-t))] pb-[calc(2rem+var(--safe-b))]">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          aria-label={t.common.back}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/8 text-lg"
        >
          ←
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-2xl font-extrabold">{t.rules.title}</h1>
        <LangSwitch />
      </div>

      <ol className="space-y-3">
        {t.rules.items.map((rule, i) => (
          <li key={rule.title} className="glass rounded-3xl p-5">
            <div className="flex items-baseline gap-3">
              <span className="text-sm font-extrabold text-lime tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="text-lg font-bold">{rule.title}</h2>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{rule.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
