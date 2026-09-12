"use client";

import type { Player } from "@/lib/game/types";
import { Button, Card, LinkButton } from "./ui";

const MEDALS = ["🥇", "🥈", "🥉"];

export function FinalSheet({
  players,
  myId,
  onRematch,
  canRematch,
  extra,
}: {
  players: Player[];
  myId: string;
  onRematch: () => void;
  canRematch: boolean;
  extra?: React.ReactNode;
}) {
  const ranked = [...players].sort((a, b) => b.score - a.score);
  const top = ranked[0];
  const iWon = top?.id === myId;
  const podium = ranked.slice(0, 3);

  return (
    <div className="shell flex min-h-[100svh] flex-col justify-center gap-6 py-[calc(2rem+var(--safe-t))]">
      <div className="animate-pop text-center">
        <div className="text-6xl">{iWon ? "🏆" : top?.emoji}</div>
        <h1 className="fluid-title mt-3 font-extrabold">
          {iWon ? "Gewonnen!" : `${top?.name} gewinnt`}
        </h1>
        <p className="mt-2 text-muted">
          {top?.score} Punkte
          {ranked[1] ? ` · ${top.score - ranked[1].score} Vorsprung` : ""}
        </p>
      </div>

      <div className="flex items-end justify-center gap-2 sm:gap-4">
        {[1, 0, 2].map((slot) => {
          const p = podium[slot];
          if (!p) return null;
          const heights = ["h-28", "h-36", "h-24"];
          return (
            <div key={p.id} className="flex w-24 flex-col items-center gap-2 sm:w-28">
              <span className="text-3xl">{p.emoji}</span>
              <span className="max-w-full truncate text-xs font-semibold">{p.name}</span>
              <div
                className={`glass flex w-full ${heights[slot]} flex-col items-center justify-center gap-1 rounded-2xl ${
                  slot === 0 ? "border-amber/50 bg-amber/10" : ""
                }`}
              >
                <span className="text-2xl">{MEDALS[slot]}</span>
                <span className="text-lg font-extrabold tabular-nums">{p.score}</span>
              </div>
            </div>
          );
        })}
      </div>

      {ranked.length > 3 ? (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-white/5">
            {ranked.slice(3).map((p, i) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-5 text-sm font-bold text-muted tabular-nums">{i + 4}</span>
                <span className="text-lg">{p.emoji}</span>
                <span className="min-w-0 flex-1 truncate font-semibold">{p.name}</span>
                <span className="font-extrabold tabular-nums">{p.score}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {extra}

      <div className="flex flex-col gap-2 sm:flex-row">
        {canRematch ? (
          <Button full size="lg" onClick={onRematch}>
            Revanche
          </Button>
        ) : null}
        <LinkButton href="/" variant="secondary" size="lg" full>
          Zum Start
        </LinkButton>
      </div>
    </div>
  );
}
