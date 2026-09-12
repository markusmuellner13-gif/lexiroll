"use client";

import type { Answers, Category, Player } from "@/lib/game/types";
import { isFormallyValid, vetoKey } from "@/lib/game/scoring";
import { useLang } from "@/lib/i18n/provider";
import { Button, Chip } from "./ui";

/**
 * The argument phase. Everyone gets to strike answers they think are bogus -
 * which is the only honest way to judge made-up categories.
 */
export function ReviewSheet({
  categories,
  letter,
  players,
  answers,
  vetoes,
  myId,
  onVeto,
  onConfirm,
  confirmed,
  secondsLeft,
  roundLabel,
}: {
  categories: Category[];
  letter: string;
  players: Player[];
  answers: Record<string, Answers>;
  vetoes: Record<string, string[]>;
  myId: string;
  onVeto: (target: string, on: boolean) => void;
  onConfirm: () => void;
  confirmed: string[];
  secondsLeft: number | null;
  roundLabel: string;
}) {
  const { t } = useLang();
  const humans = players.filter((p) => p.kind === "human");
  const iAmDone = confirmed.includes(myId);

  return (
    <div className="flex min-h-[100svh] flex-col">
      <header
        className="sticky top-0 z-30 border-b border-white/10 bg-ink/85 py-3 backdrop-blur-xl"
        style={{ paddingTop: "calc(0.75rem + var(--safe-t))" }}
      >
        <div className="shell flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-lime to-cyan text-2xl font-extrabold text-ink">
            {letter}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-muted">{roundLabel}</div>
            <div className="text-lg font-extrabold">{t.review.title}</div>
          </div>
          {secondsLeft !== null ? (
            <Chip tone={secondsLeft <= 10 ? "magenta" : "neutral"}>{secondsLeft}s</Chip>
          ) : null}
        </div>
      </header>

      <main className="shell flex-1 space-y-4 py-5">
        <p className="text-sm text-muted">
          {t.review.hint}
        </p>

        {categories.map((category) => (
          <section key={category.id} className="glass overflow-hidden rounded-3xl">
            <h3 className="border-b border-white/10 px-4 py-2.5 text-sm font-bold tracking-wide text-muted uppercase">
              {category.name}
            </h3>
            <ul className="divide-y divide-white/5">
              {players.map((player) => {
                const word = (answers[player.id]?.[category.id] ?? "").trim();
                const target = vetoKey(player.id, category.id);
                const voters = vetoes[target] ?? [];
                const struck = voters.length >= Math.ceil(Math.max(1, humans.length - (player.kind === "human" ? 1 : 0)) / 2);
                const iVoted = voters.includes(myId);
                const mine = player.id === myId;
                const formallyBad = word.length > 0 && !isFormallyValid(word, letter);

                return (
                  <li key={player.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-lg" aria-hidden>
                      {player.emoji}
                    </span>
                    <span className="w-20 shrink-0 truncate text-xs font-semibold text-muted">
                      {mine ? t.common.you : player.name}
                    </span>
                    <span
                      className={`min-w-0 flex-1 truncate text-base font-semibold ${
                        struck || formallyBad ? "text-muted line-through" : ""
                      } ${!word ? "text-white/25" : ""}`}
                    >
                      {word || "—"}
                    </span>
                    {formallyBad ? (
                      <Chip tone="magenta">{t.review.wrongLetter}</Chip>
                    ) : word && !mine ? (
                      <button
                        type="button"
                        onClick={() => onVeto(target, !iVoted)}
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold transition-colors ${
                          iVoted ? "bg-magenta text-white" : "bg-white/10 text-muted hover:bg-white/20"
                        }`}
                      >
                        {iVoted ? `${t.review.struck}${voters.length > 1 ? ` ×${voters.length}` : ""}` : t.review.strike}
                      </button>
                    ) : voters.length ? (
                      <Chip tone="magenta">×{voters.length}</Chip>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </main>

      <footer
        className="sticky bottom-0 z-30 border-t border-white/10 bg-ink/90 backdrop-blur-xl"
        style={{ paddingBottom: "var(--safe-b)" }}
      >
        <div className="shell flex items-center gap-3 py-3">
          <div className="min-w-0 flex-1 text-sm font-semibold text-muted">
            {t.review.progress(confirmed.length, humans.length)}
          </div>
          <Button size="lg" onClick={onConfirm} disabled={iAmDone}>
            {iAmDone ? t.review.waiting : t.review.done}
          </Button>
        </div>
      </footer>
    </div>
  );
}
