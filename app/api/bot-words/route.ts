import { NextResponse } from "next/server";
import { getBankCache, putBankCache } from "@/lib/db";
import { normalize } from "@/lib/game/categories";
import { hardLetters } from "@/lib/game/letters";
import { ALPHABET } from "@/lib/game/letters";
import { isLang, type Lang } from "@/lib/i18n/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = "claude-haiku-4-5-20251001";

type Bank = Record<string, string[]>;

/** One prompt per language, so the bots learn words people actually use. */
const PROMPTS: Record<Lang, (category: string, letters: string) => string> = {
  de: (category, letters) => `Wir spielen "Stadt Land Fluss" auf Deutsch. Die Kategorie lautet: "${category}".

Nenne fuer JEDEN der folgenden Anfangsbuchstaben 3 kurze, allgemein bekannte deutsche Begriffe, die eindeutig in diese Kategorie passen und mit dem Buchstaben beginnen: ${letters}.

Antworte AUSSCHLIESSLICH mit JSON in genau dieser Form, ohne Erklaerung, ohne Markdown:
{"A":["...","...","..."],"B":["...","...","..."], ...}

Wenn dir fuer einen Buchstaben nichts Passendes einfaellt, gib eine leere Liste zurueck. Erfinde keine Woerter.`,

  en: (category, letters) => `We are playing the word game "Categories" (Stadt-Land-Fluss / Scattergories style) in English. The category is: "${category}".

For EACH of the following starting letters, give 3 short, widely known English terms that clearly belong to this category and start with that letter: ${letters}.

Reply with JSON ONLY, exactly in this shape, no explanation, no markdown:
{"A":["...","...","..."],"B":["...","...","..."], ...}

If nothing fits a letter, return an empty list for it. Do not invent words.`,

  it: (category, letters) => `Stiamo giocando a "Nomi, cose, città" in italiano. La categoria è: "${category}".

Per OGNI lettera iniziale seguente, indica 3 termini italiani brevi e comunemente noti che appartengono chiaramente a questa categoria e iniziano con quella lettera: ${letters}.

Rispondi SOLO con JSON, esattamente in questa forma, senza spiegazioni e senza markdown:
{"A":["...","...","..."],"B":["...","...","..."], ...}

Se per una lettera non c'è nulla di adatto, restituisci una lista vuota. Non inventare parole.`,
};

function lettersFor(lang: Lang): string[] {
  const skip = hardLetters(lang);
  return ALPHABET.filter((l) => !skip.includes(l));
}

/**
 * Teaches the bots a category the player invented.
 *
 * Order of attack: cached bank in the database, then the Claude API if a key is
 * configured. Without a key we answer with nothing and the client falls back to
 * its generic noun pool, so custom categories always work - just less sharply.
 */
export async function POST(request: Request) {
  let names: string[] = [];
  let lang: Lang = "en";
  try {
    const body = (await request.json()) as { categories?: unknown; lang?: unknown };
    if (isLang(body.lang)) lang = body.lang;
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
    const cached = await getBankCache(lang, normalize(name));
    if (cached) banks[name] = cached;
    else missing.push(name);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (missing.length && apiKey) {
    const generated = await Promise.all(missing.map((name) => generateBank(name, lang, apiKey)));
    for (let i = 0; i < missing.length; i++) {
      const bank = generated[i];
      if (!bank) continue;
      banks[missing[i]] = bank;
      await putBankCache(lang, normalize(missing[i]), missing[i], bank);
    }
  }

  return NextResponse.json({ banks, generated: missing.length > 0 && !!apiKey });
}

async function generateBank(category: string, lang: Lang, apiKey: string): Promise<Bank | null> {
  const letters = lettersFor(lang);
  const prompt = PROMPTS[lang](category, letters.join(", "));

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
        .filter((w) => w.length > 1 && w.length < 40 && startsWith(w, key))
        .slice(0, 4);
      if (cleaned.length) bank[key] = cleaned;
    }
    return Object.keys(bank).length >= 8 ? bank : null;
  } catch {
    return null;
  }
}

function startsWith(word: string, letter: string): boolean {
  const first = word.charAt(0).toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return first === letter;
}
