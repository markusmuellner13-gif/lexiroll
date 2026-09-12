"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n/provider";
import { loadStats, type Stats } from "@/lib/storage";
import { InstallPrompt } from "./InstallPrompt";
import { LangSwitch } from "./LangSwitch";
import { Mark } from "./Logo";
import { Card, Chip } from "./ui";

export function Home() {
  const { t } = useLang();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    setStats(loadStats());
  }, []);

  return (
    <div className="shell flex min-h-[100svh] flex-col gap-8 py-[calc(2rem+var(--safe-t))] pb-[calc(2rem+var(--safe-b))]">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Mark size={34} />
          <span className="text-lg font-extrabold tracking-tight">
            Lexi<span className="text-lime">roll</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {stats && stats.games > 0 ? (
            <Chip tone="lime" className="hidden sm:inline-flex">
              {t.home.wins(stats.wins, stats.games)}
            </Chip>
          ) : null}
          <LangSwitch />
        </div>
      </header>

      <section className="animate-slide-up">
        <h1 className="fluid-title font-extrabold">
          {t.heroWords[0]}
          <br />
          {t.heroWords[1]}
          <span className="text-lime"> {t.heroWords[2]}</span>
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-muted">{t.home.intro}</p>
      </section>

      <nav className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/solo"
          className="group glass relative overflow-hidden rounded-3xl p-6 transition-transform duration-200 hover:-translate-y-1 active:scale-[0.99]"
        >
          <div
            className="absolute -top-16 -right-12 h-40 w-40 rounded-full blur-3xl"
            style={{ background: "rgba(184,255,74,0.35)", opacity: 0.55 }}
          />
          <div className="relative">
            <div className="text-4xl">🤖</div>
            <h2 className="mt-3 text-2xl font-extrabold">{t.home.soloTitle}</h2>
            <p className="mt-1 text-sm text-muted">{t.home.soloDesc}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-lime">
              {t.home.soloCta} <span aria-hidden>→</span>
            </span>
          </div>
        </Link>

        <Link
          href="/play"
          className="group glass relative overflow-hidden rounded-3xl p-6 transition-transform duration-200 hover:-translate-y-1 active:scale-[0.99]"
        >
          <div
            className="absolute -top-16 -right-12 h-40 w-40 rounded-full blur-3xl"
            style={{ background: "rgba(255,79,163,0.35)", opacity: 0.55 }}
          />
          <div className="relative">
            <div className="text-4xl">🌍</div>
            <h2 className="mt-3 text-2xl font-extrabold">{t.home.friendsTitle}</h2>
            <p className="mt-1 text-sm text-muted">{t.home.friendsDesc}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-magenta">
              {t.home.friendsCta} <span aria-hidden>→</span>
            </span>
          </div>
        </Link>
      </nav>

      <InstallPrompt />

      <Card className="grid gap-4 p-5 sm:grid-cols-3">
        <Rule emoji="🎲" title={t.home.ruleDice.title} body={t.home.ruleDice.body} />
        <Rule emoji="✏️" title={t.home.ruleCategories.title} body={t.home.ruleCategories.body} />
        <Rule emoji="🏅" title={t.home.ruleScoring.title} body={t.home.ruleScoring.body} />
      </Card>

      <footer className="mt-auto flex items-center justify-between gap-4 pt-4 text-xs text-muted">
        <span>{t.home.footer}</span>
        <Link href="/rules" className="shrink-0 underline underline-offset-2 hover:text-paper">
          {t.home.rulesLink}
        </Link>
      </footer>
    </div>
  );
}

function Rule({ emoji, title, body }: { emoji: string; title: string; body: string }) {
  return (
    <div>
      <div className="text-2xl">{emoji}</div>
      <h3 className="mt-1 text-sm font-bold">{title}</h3>
      <p className="mt-0.5 text-xs leading-relaxed text-muted">{body}</p>
    </div>
  );
}
