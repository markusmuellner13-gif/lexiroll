"use client";

import { useState } from "react";
import { DEFAULT_CATEGORIES, SUGGESTED_CATEGORIES, makeCategory } from "@/lib/game/categories";
import { hasBank } from "@/lib/game/wordbank";
import type { Category } from "@/lib/game/types";
import { Button, Card, Chip } from "./ui";

const MAX = 12;

export function CategoryEditor({
  categories,
  onChange,
  disabled,
  learning,
}: {
  categories: Category[];
  onChange: (next: Category[]) => void;
  disabled?: boolean;
  learning?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const taken = new Set(categories.map((c) => c.name.toLowerCase()));

  const add = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || categories.length >= MAX || taken.has(trimmed.toLowerCase())) return;
    onChange([...categories, makeCategory(trimmed)]);
    setDraft("");
  };

  const remove = (id: string) => {
    if (categories.length <= 1) return;
    onChange(categories.filter((c) => c.id !== id));
  };

  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold tracking-wide text-muted uppercase">
          Kategorien ({categories.length}/{MAX})
        </h3>
        {!disabled ? (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_CATEGORIES.map((c) => ({ ...c })))}
            className="text-xs font-semibold text-muted underline underline-offset-2 hover:text-paper"
          >
            Klassiker
          </button>
        ) : null}
      </div>

      <ul className="flex flex-wrap gap-2">
        {categories.map((c) => {
          const known = hasBank(c.bank);
          return (
            <li
              key={c.id}
              className={`flex items-center gap-2 rounded-2xl border px-3 py-2 ${
                known ? "border-lime/30 bg-lime/10" : "border-amber/30 bg-amber/10"
              }`}
            >
              <span className="text-sm font-bold">{c.name}</span>
              <span className="text-[10px] font-semibold opacity-70" title={known ? "Die Bots kennen diese Kategorie" : "Die Bots raten hier"}>
                {known ? "🤖✓" : learning ? "🤖…" : "🤖?"}
              </span>
              {!disabled && categories.length > 1 ? (
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  aria-label={`${c.name} entfernen`}
                  className="-mr-1 grid h-5 w-5 place-items-center rounded-full bg-white/10 text-xs hover:bg-magenta hover:text-white"
                >
                  ×
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>

      {!disabled ? (
        <>
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add(draft);
                }
              }}
              maxLength={40}
              placeholder="Eigene Kategorie, z.B. Pizzabelag"
              className="glass min-w-0 flex-1 rounded-2xl px-4 py-3 text-base font-semibold outline-none placeholder:text-white/25 focus:border-lime/50"
            />
            <Button onClick={() => add(draft)} disabled={!draft.trim() || categories.length >= MAX}>
              Add
            </Button>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-muted">Schnell hinzufügen</div>
            <div className="-mx-1 flex flex-wrap gap-1.5 px-1">
              {SUGGESTED_CATEGORIES.filter((s) => !taken.has(s.name.toLowerCase())).map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => add(s.name)}
                  disabled={categories.length >= MAX}
                  className="rounded-full bg-white/8 px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-lime/20 hover:text-lime disabled:opacity-30"
                >
                  + {s.name}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs leading-relaxed text-muted">
            <Chip tone="lime">🤖✓</Chip> heißt: die Bots haben echtes Wissen für diese Kategorie.{" "}
            <Chip tone="amber">🤖?</Chip> heißt: sie raten — und du darfst ihre Antworten in der
            Prüfrunde streichen.
          </p>
        </>
      ) : null}
    </Card>
  );
}
