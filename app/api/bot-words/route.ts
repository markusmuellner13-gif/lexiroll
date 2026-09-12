import { NextResponse } from "next/server";
import { getBankCache, putBankCache } from "@/lib/db";
import { normalize } from "@/lib/game/categories";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = "claude-haiku-4-5-20251001";
const LETTERS = "ABCDEFGHIJKLMNOPRSTUVWZ".split("");

type Bank = Record<string, string[]>;

/**
 * Teaches the bots a category the player invented.
 *
 * Order of attack: cached bank in the database, then the Claude API if a key is
 * configured. Without a key we answer with nothing and the client falls back to
 * its generic noun pool, so custom categories always work - just less sharply.
 */
export async function POST(request: Request) {
  let names: string[] = [];
  try {
    const body = (await request.json()) as { categories?: unknown };
    if (Array.isArray(body.categories)) {
      names = body.categories.map((c) => String(c).slice(0, 60)).filter(Boolean).slice(0, 12);
    }
  } catch {
    return NextResponse.json({ banks: {} }, { status: 400 });
  }
  if (!names.length) return NextResponse.json({ banks: {} });

  const banks: Record<string, Bank> = {};
  const missing: string[] = [];

  for (const name of names) {
    const cached = await getBankCache(normalize(name));
    if (cached) banks[name] = cached;
    else missing.push(name);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (missing.length && apiKey) {
    const generated = await Promise.all(missing.map((name) => generateBank(name, apiKey)));
    for (let i = 0; i < missing.length; i++) {
      const bank = generated[i];
      if (!bank) continue;
      banks[missing[i]] = bank;
      await putBankCache(normalize(missing[i]), missing[i], bank);
    }
  }

  return NextResponse.json({ banks, generated: missing.length > 0 && !!apiKey });
}

async function generateBank(category: string, apiKey: string): Promise<Bank | null> {
  const prompt = `Wir spielen "Stadt Land Fluss" auf Deutsch. Die Kategorie lautet: "${category}".

Nenne fuer JEDEN der folgenden Anfangsbuchstaben 3 kurze, allgemein bekannte deutsche Begriffe, die eindeutig in diese Kategorie passen und mit dem Buchstaben beginnen: ${LETTERS.join(", ")}.

Antworte AUSSCHLIESSLICH mit JSON in genau dieser Form, ohne Erklaerung, ohne Markdown:
{"A":["...","...","..."],"B":["...","...","..."], ...}

Wenn dir fuer einen Buchstaben nichts Passendes einfaellt, gib fuer diesen Buchstaben eine leere Liste zurueck. Erfinde keine Woerter.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = data.content?.find((c) => c.type === "text")?.text ?? "";
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    const parsed = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;

    const bank: Bank = {};
    for (const [letter, words] of Object.entries(parsed)) {
      const key = letter.trim().toUpperCase().slice(0, 1);
      if (!key || !Array.isArray(words)) continue;
      const cleaned = words
        .map((w) => String(w).trim())
        .filter((w) => w.length > 1 && w.length < 40 && w.charAt(0).toUpperCase() === key)
        .slice(0, 4);
      if (cleaned.length) bank[key] = cleaned;
    }
    return Object.keys(bank).length >= 8 ? bank : null;
  } catch {
    return null;
  }
}
