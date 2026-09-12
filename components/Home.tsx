"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mark } from "./Logo";
import { InstallPrompt } from "./InstallPrompt";
import { Card, Chip } from "./ui";
import { loadStats, type Stats } from "@/lib/storage";

export function Home() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    setStats(loadStats());
  }, []);

  return (
    <div className="shell flex min-h-[100svh] flex-col gap-8 py-[calc(2rem+var(--safe-t))] pb-[calc(2rem+var(--safe-b))]">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Mark size={34} />
          <span className="text-lg font-extrabold tracking-tight">
            Wort<span className="text-lime">jagd</span>
          </span>
        </div>
        {stats && stats.games > 0 ? (
          <Chip tone="lime">
            {stats.wins}/{stats.games} gewonnen
          </Chip>
        ) : null}
      </header>

      <section className="animate-slide-up">
        <h1 className="fluid-title font-extrabold">
          Stadt.
          <br />
          Land.
          <span className="text-lime"> Fluss.</span>
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
          Der Klassiker, neu gewürfelt. Eigene Kategorien, ein Buchstabenwürfel und Bots, die
          wirklich mitdenken — oder Freunde, egal wo sie gerade sind.
        </p>
      </section>

      <nav className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/solo"
          className="group glass relative overflow-hidden rounded-3xl p-6 transition-transform duration-200 hover:-translate-y-1 active:scale-[0.99]"
        >
          <div
            className="absolute -top-16 -right-12 h-40 w-40 rounded-full blur-3xl transition-opacity group-hover:opacity-100"
            style={{ background: "rgba(184,255,74,0.35)", opacity: 0.55 }}
          />
          <div className="relative">
            <div className="text-4xl">🤖</div>
            <h2 className="mt-3 text-2xl font-extrabold">Solo gegen Bots</h2>
            <p className="mt-1 text-sm text-muted">
              Sofort losspielen. Kein Account, keine Anmeldung, kein Internet nötig.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-lime">
              Spielen <span aria-hidden>→</span>
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
            <h2 className="mt-3 text-2xl font-extrabold">Mit Freunden</h2>
            <p className="mt-1 text-sm text-muted">
              Raum aufmachen, Code teilen, zusammen spielen — von überall, auf jedem Gerät.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-magenta">
              Raum erstellen <span aria-hidden>→</span>
            </span>
          </div>
        </Link>
      </nav>

      <InstallPrompt />

      <Card className="grid gap-4 p-5 sm:grid-cols-3">
        <Rule emoji="🎲" title="Würfel entscheidet">
          Jede Runde würfelt die App einen neuen Buchstaben — keine Wiederholungen.
        </Rule>
        <Rule emoji="✏️" title="Kategorien nach Wunsch">
          Stadt, Land, Fluss … oder Pizzabelag. Die Bots stellen sich darauf ein.
        </Rule>
        <Rule emoji="🏅" title="Klassische Wertung">
          20 / 10 / 5 Punkte — und alle dürfen faule Antworten streichen.
        </Rule>
      </Card>

      <footer className="mt-auto flex items-center justify-between pt-4 text-xs text-muted">
        <span>Solo läuft komplett offline auf deinem Gerät.</span>
        <Link href="/regeln" className="underline underline-offset-2 hover:text-paper">
          Regeln
        </Link>
      </footer>
    </div>
  );
}

function Rule({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-2xl">{emoji}</div>
      <h3 className="mt-1 text-sm font-bold">{title}</h3>
      <p className="mt-0.5 text-xs leading-relaxed text-muted">{children}</p>
    </div>
  );
}
