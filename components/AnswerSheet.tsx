"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Answers, Category, Player } from "@/lib/game/types";
import { startsWithLetter } from "@/lib/game/scoring";
import { Button } from "./ui";

export function AnswerSheet({
  categories,
  letter,
  answers,
  onChange,
  onSubmit,
  locked,
  allowStop,
  msLeft,
  totalMs,
  players,
  progress,
  stoppedBy,
  roundLabel,
}: {
  categories: Category[];
  letter: string;
  answers: Answers;
  onChange: (categoryId: string, value: string) => void;
  onSubmit: (stop: boolean) => void;
  locked: boolean;
  allowStop: boolean;
  msLeft: number | null;
  totalMs: number | null;
  players: Player[];
  progress: Record<string, number>;
  stoppedBy: Player | null;
  roundLabel: string;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Only grab focus on pointer-fine devices: on phones it would pop the
    // keyboard over the letter before the player has even seen it.
    if (window.matchMedia("(pointer: fine)").matches) refs.current[0]?.focus();
  }, [letter]);

  const filled = useMemo(
    () => categories.filter((c) => (answers[c.id] ?? "").trim().length > 0).length,
    [categories, answers],
  );
  const allFilled = filled === categories.length;

  const seconds = msLeft === null ? null : Math.max(0, Math.ceil(msLeft / 1000));
  const urgent = seconds !== null && seconds <= 10;
  const pct = totalMs && msLeft !== null ? Math.max(0, Math.min(100, (msLeft / totalMs) * 100)) : 100;

  return (
    <div className="flex min-h-[100svh] flex-col">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/85 backdrop-blur-xl">
        <div className="h-1 w-full bg-white/8">
          <div
            className={`h-full transition-[width] duration-1000 ease-linear ${urgent ? "bg-magenta" : "bg-lime"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="shell flex items-center gap-3 py-3" style={{ paddingTop: "calc(0.75rem + var(--safe-t))" }}>
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-lime to-cyan text-3xl font-extrabold text-ink">
            {letter}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold text-muted">{roundLabel}</div>
            <div className={`text-2xl font-extrabold tabular-nums ${urgent ? "animate-urgent text-magenta" : ""}`}>
              {seconds === null ? "∞" : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`}
            </div>
          </div>
          <div className="flex max-w-[45%] flex-wrap justify-end gap-1.5">
            {players.map((p) => {
              const done = progress[p.id] ?? 0;
              const complete = done >= categories.length;
              return (
                <span
                  key={p.id}
                  title={`${p.name}: ${done}/${categories.length}`}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold tabular-nums ${
                    complete ? "bg-lime/20 text-lime" : "bg-white/8 text-muted"
                  }`}
                >
                  <span aria-hidden>{p.emoji}</span>
                  {done}/{categories.length}
                </span>
              );
            })}
          </div>
        </div>
      </header>

      {stoppedBy ? (
        <div className="bg-magenta/90 py-2 text-center text-sm font-bold text-white">
          {stoppedBy.emoji} {stoppedBy.name} hat gestoppt — Stifte fallen lassen!
        </div>
      ) : null}

      <main className="shell flex-1 py-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category, i) => {
            const value = answers[category.id] ?? "";
            const wrong = value.trim().length > 0 && !startsWithLetter(value, letter);
            return (
              <label
                key={category.id}
                className={`glass group relative flex flex-col gap-1 rounded-2xl px-4 py-3 transition-colors ${
                  wrong ? "border-magenta/60" : value.trim() ? "border-lime/40" : ""
                }`}
              >
                <span className="text-xs font-bold tracking-wide text-muted uppercase">{category.name}</span>
                <input
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  value={value}
                  disabled={locked}
                  onChange={(e) => onChange(category.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const next = refs.current[i + 1];
                      if (next) next.focus();
                      else if (allFilled) onSubmit(allowStop);
                    }
                  }}
                  enterKeyHint={i === categories.length - 1 ? "done" : "next"}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="words"
                  spellCheck={false}
                  placeholder={`${letter}…`}
                  className="w-full bg-transparent text-lg font-semibold outline-none placeholder:text-white/20 disabled:opacity-60"
                />
                {wrong ? (
                  <span className="absolute right-3 bottom-2 text-xs font-bold text-magenta">
                    beginnt nicht mit {letter}
                  </span>
                ) : null}
              </label>
            );
          })}
        </div>
      </main>

      <footer
        className="sticky bottom-0 z-30 border-t border-white/10 bg-ink/90 backdrop-blur-xl"
        style={{ paddingBottom: "var(--safe-b)" }}
      >
        <div className="shell flex items-center gap-3 py-3">
          <div className="min-w-0 flex-1 text-sm font-semibold text-muted tabular-nums">
            {filled}/{categories.length} ausgefüllt
          </div>
          {locked ? (
            <div className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-bold text-muted">
              Abgegeben — warte auf die anderen…
            </div>
          ) : allowStop && allFilled ? (
            <Button variant="danger" size="lg" onClick={() => onSubmit(true)}>
              STOPP!
            </Button>
          ) : (
            <Button variant="secondary" size="lg" onClick={() => onSubmit(false)}>
              Abgeben
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
