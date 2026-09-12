"use client";

import { useEffect, useRef, useState } from "react";
import { normalize } from "./game/categories";
import { hasBank, registerBank } from "./game/wordbank";
import type { Category } from "./game/types";
import { cacheBank, loadCachedBanks } from "./storage";

/**
 * Teaches the bots categories they have never seen.
 *
 * Anything cached in this browser is loaded instantly; the rest is asked from
 * /api/bot-words, which uses the Claude API when a key is configured. Failure is
 * fine - the bots then guess from the generic noun pool and players can strike
 * the nonsense in the review phase.
 */
export function useBotTraining(
  categories: Category[],
  onLearned: (updates: { id: string; bank: string }[]) => void,
) {
  const [learning, setLearning] = useState(false);
  const asked = useRef(new Set<string>());
  const callback = useRef(onLearned);
  callback.current = onLearned;

  const signature = categories.map((c) => `${c.id}:${c.bank ?? ""}`).join("|");

  useEffect(() => {
    const unknown = categories.filter((c) => !hasBank(c.bank));
    if (!unknown.length) return;

    const cached = loadCachedBanks();
    const fromCache: { id: string; bank: string }[] = [];
    const toAsk: Category[] = [];

    for (const category of unknown) {
      const key = normalize(category.name);
      if (!key) continue;
      if (cached[key]) {
        registerBank(key, cached[key]);
        fromCache.push({ id: category.id, bank: key });
      } else if (!asked.current.has(key)) {
        toAsk.push(category);
      }
    }

    if (fromCache.length) callback.current(fromCache);
    if (!toAsk.length) return;

    let cancelled = false;
    for (const c of toAsk) asked.current.add(normalize(c.name));
    setLearning(true);

    fetch("/api/bot-words", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ categories: toAsk.map((c) => c.name) }),
    })
      .then((r) => (r.ok ? r.json() : { banks: {} }))
      .then((data: { banks?: Record<string, Record<string, string[]>> }) => {
        if (cancelled || !data.banks) return;
        const learned: { id: string; bank: string }[] = [];
        for (const [name, bank] of Object.entries(data.banks)) {
          const key = normalize(name);
          if (!key || !bank || !Object.keys(bank).length) continue;
          registerBank(key, bank);
          cacheBank(key, bank);
          const match = toAsk.find((c) => normalize(c.name) === key);
          if (match) learned.push({ id: match.id, bank: key });
        }
        if (learned.length) callback.current(learned);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLearning(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return learning;
}

/** Loads every cached bank into memory - call once when a game screen mounts. */
export function hydrateCachedBanks() {
  const cached = loadCachedBanks();
  for (const [key, bank] of Object.entries(cached)) registerBank(key, bank);
}
