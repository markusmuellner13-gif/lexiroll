"use client";

import { useState } from "react";
import { defaultCategories, makeCategory, suggestedCategories } from "@/lib/game/categories";
import { hasBank } from "@/lib/game/wordbank";
import type { Category } from "@/lib/game/types";
import { useLang } from "@/lib/i18n/provider";
import type { Lang } from "@/lib/i18n/types";
import { Button, Card, Chip } from "./ui";

const MAX = 12;

export function CategoryEditor({
  lang,
  categories,
  onChange,
  disabled,
  learning,
}: {
  /** Language of the category list - the room's, not necessarily the reader's. */
  lang: Lang;
  categories: Category[];
  onChange: (next: Category[]) => void;
  disabled?: boolean;
  learning?: boolean;
}) {
  const { t } = useLang();
  const [draft, setDraft] = useState("");
  const taken = new Set(categories.map((c) => c.name.toLowerCase()));

  const add = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || categories.length >= MAX || taken.has(trimmed.toLowerCase())) return;
    onChange([...categories, makeCategory(lang, trimmed)]);
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
          {t.categories.title(categories.length, MAX)}
        </h3>
        {!disabled ? (
          <button
            type="button"
            onClick={() => onChange(defaultCategories(lang))}
            className="text-xs font-semibold text-muted underline underline-offset-2 hover:text-paper"
          >
            {t.categories.classic}
          </button>
        ) : null}
      </div>

      <ul className="flex flex-wrap gap-2">
        {categories.map((c) => {
          const known = hasBank(lang, c.bank);
          return (
            <li
              key={c.id}
              className={`flex items-center gap-2 rounded-2xl border px-3 py-2 ${
                known ? "border-lime/30 bg-lime/10" : "border-amber/30 bg-amber/10"
              }`}
            >
              <span className="text-sm font-bold">{c.name}</span>
              <span
                className="text-[10px] font-semibold opacity-70"
                title={known ? t.categories.knownTitle : t.categories.guessTitle}
              >
                {known ? "🤖✓" : learning ? "🤖…" : "🤖?"}
              </span>
              {!disabled && categories.length > 1 ? (
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  aria-label={t.categories.remove(c.name)}
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
              placeholder={t.categories.placeholder}
              className="glass min-w-0 flex-1 rounded-2xl px-4 py-3 text-base font-semibold outline-none placeholder:text-white/25 focus:border-lime/50"
            />
            <Button onClick={() => add(draft)} disabled={!draft.trim() || categories.length >= MAX}>
              {t.categories.add}
            </Button>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-muted">{t.categories.quickAdd}</div>
            <div className="-mx-1 flex flex-wrap gap-1.5 px-1">
              {suggestedCategories(lang)
                .filter((s) => !taken.has(s.name.toLowerCase()))
                .map((s) => (
                  <button
                    key={s.bank}
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
            <Chip tone="lime">🤖✓</Chip> {t.categories.legend} <Chip tone="amber">🤖?</Chip>{" "}
            {t.categories.legendGuess}
          </p>
        </>
      ) : null}
    </Card>
  );
}
