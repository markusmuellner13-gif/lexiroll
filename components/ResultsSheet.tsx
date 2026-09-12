"use client";

import type { Category, Player, RoundResult, ScoredAnswer } from "@/lib/game/types";
import { Button, Card } from "./ui";

const TONE: Record<ScoredAnswer["status"], string> = {
  solo: "bg-amber/20 text-amber",
  unique: "bg-lime/20 text-lime",
  duplicate: "bg-cyan/18 text-cyan",
  invalid: "bg-magenta/20 text-magenta",
  empty: "bg-white/8 text-white/35",
};

export function ResultsSheet({
  categories,
  players,
  result,
  roundLabel,
  onNext,
  canAdvance,
  nextLabel,
  waitingFor,
}: {
  categories: Category[];
  players: Player[];
  result: RoundResult;
  roundLabel: string;
  onNext: () => void;
  canAdvance: boolean;
  nextLabel: string;
  waitingFor?: string;
}) {
  const byPlayer = new Map<string, Map<string, ScoredAnswer>>();
  for (const a of result.answers) {
    if (!byPlayer.has(a.playerId)) byPlayer.set(a.playerId, new Map());
    byPlayer.get(a.playerId)!.set(a.categoryId, a);
  }

  const ranked = [...players].sort((a, b) => b.score - a.score);
  const roundRanked = [...players].sort(
    (a, b) => (result.totals[b.id] ?? 0) - (result.totals[a.id] ?? 0),
  );

  return (
    <div className="flex min-h-[100svh] flex-col">
      <header className="shell pt-[calc(1.5rem+var(--safe-t))] pb-2 text-center">
        <div className="text-xs font-semibold text-muted">{roundLabel}</div>
        <h2 className="fluid-title mt-1 font-extrabold">
          Buchstabe <span className="text-lime">{result.letter}</span>
        </h2>
      </header>

      <main className="shell flex-1 space-y-5 py-4">
        <Card className="overflow-hidden">
          <h3 className="border-b border-white/10 px-4 py-3 text-sm font-bold tracking-wide text-muted uppercase">
            Punkte diese Runde
          </h3>
          <ul className="divide-y divide-white/5">
            {roundRanked.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-lg">{p.emoji}</span>
                <span className="min-w-0 flex-1 truncate font-semibold">{p.name}</span>
                <span className="text-lg font-extrabold text-lime tabular-nums">
                  +{result.totals[p.id] ?? 0}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <div className="-mx-4 overflow-x-auto px-4 no-scrollbar">
          <table className="w-full min-w-[36rem] border-separate border-spacing-y-1.5">
            <thead>
              <tr className="text-left text-xs font-bold tracking-wide text-muted uppercase">
                <th className="px-3 py-1">Kategorie</th>
                {players.map((p) => (
                  <th key={p.id} className="px-3 py-1">
                    <span className="mr-1">{p.emoji}</span>
                    <span className="hidden sm:inline">{p.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td className="glass rounded-l-xl px-3 py-2 text-sm font-semibold whitespace-nowrap">
                    {c.name}
                  </td>
                  {players.map((p, i) => {
                    const a = byPlayer.get(p.id)?.get(c.id);
                    const status = a?.status ?? "empty";
                    return (
                      <td
                        key={p.id}
                        className={`glass px-3 py-2 ${i === players.length - 1 ? "rounded-r-xl" : ""}`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`truncate text-sm ${status === "empty" || status === "invalid" ? "text-white/35" : ""} ${status === "invalid" ? "line-through" : ""}`}
                          >
                            {a?.word || "—"}
                          </span>
                          <span
                            className={`ml-auto shrink-0 rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums ${TONE[status]}`}
                          >
                            {a?.points ?? 0}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Card className="overflow-hidden">
          <h3 className="border-b border-white/10 px-4 py-3 text-sm font-bold tracking-wide text-muted uppercase">
            Gesamtstand
          </h3>
          <ul className="divide-y divide-white/5">
            {ranked.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-5 text-sm font-bold text-muted tabular-nums">{i + 1}</span>
                <span className="text-lg">{p.emoji}</span>
                <span className="min-w-0 flex-1 truncate font-semibold">{p.name}</span>
                <span className="text-lg font-extrabold tabular-nums">{p.score}</span>
              </li>
            ))}
          </ul>
        </Card>
      </main>

      <footer
        className="sticky bottom-0 border-t border-white/10 bg-ink/90 backdrop-blur-xl"
        style={{ paddingBottom: "var(--safe-b)" }}
      >
        <div className="shell py-3">
          {canAdvance ? (
            <Button full size="lg" onClick={onNext}>
              {nextLabel}
            </Button>
          ) : (
            <div className="rounded-2xl bg-white/8 py-3.5 text-center text-sm font-semibold text-muted">
              {waitingFor ?? "Warte auf den Host…"}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
