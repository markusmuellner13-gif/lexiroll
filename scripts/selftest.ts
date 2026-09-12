/**
 * Smoke test for the game core: category matching, word banks in every
 * language, bot behaviour and scoring. Run with `npm test`.
 */
import { CATEGORY_LABELS, defaultCategories, makeCategory, resolveBank } from "../lib/game/categories";
import { answersAt, makeBots, planBotRound } from "../lib/game/bots";
import { rollLetter, ALPHABET, hardLetters } from "../lib/game/letters";
import { scoreRound, foldWord, startsWithLetter } from "../lib/game/scoring";
import { defaultSettings } from "../lib/game/defaults";
import { getBank, wordsFor } from "../lib/game/wordbank";
import { LANGS, type Lang } from "../lib/i18n/types";
import { STRINGS } from "../lib/i18n/strings";
import type { GameSettings } from "../lib/game/types";

let failures = 0;
function check(label: string, condition: boolean, detail = "") {
  if (condition) {
    console.log(`  ok   ${label}`);
  } else {
    failures++;
    console.log(`  FAIL ${label}${detail ? ` - ${detail}` : ""}`);
  }
}

console.log("\ntranslations");
const keyPaths = (obj: unknown, prefix = ""): string[] => {
  if (obj === null || typeof obj !== "object") return [prefix];
  if (Array.isArray(obj)) return obj.flatMap((v, i) => keyPaths(v, `${prefix}[${i}]`));
  return Object.entries(obj).flatMap(([k, v]) => keyPaths(v, prefix ? `${prefix}.${k}` : k));
};
const deKeys = keyPaths(STRINGS.de).sort();
for (const lang of LANGS) {
  const keys = keyPaths(STRINGS[lang]).sort();
  const missing = deKeys.filter((k) => !keys.includes(k));
  check(`${lang} has every string`, missing.length === 0, missing.slice(0, 3).join(", "));
}

console.log("\ncategory matching");
const matches: [Lang, string, string | null][] = [
  ["de", "Stadt", "city"],
  ["de", "Städte", "city"],
  ["de", "LÄNDER", "country"],
  ["de", "Lieblingstier", "animal"],
  ["de", "Süßigkeiten", "sweet"],
  ["de", "Automarke", "carbrand"],
  ["en", "City", "city"],
  ["en", "cities", "city"],
  ["en", "Animals", "animal"],
  ["en", "favourite animal", "animal"],
  ["en", "Car brand", "carbrand"],
  ["en", "Video games", "videogame"],
  ["it", "Città", "city"],
  ["it", "citta", "city"],
  ["it", "Animali", "animal"],
  ["it", "Mestiere", "job"],
  ["it", "Marca di auto", "carbrand"],
  ["it", "Bevanda", "drink"],
  ["de", "Quantenfeldtheorie", null],
  ["en", "Things in my left pocket", "object"],
  ["en", "Blorptrix zonkwave", null],
  ["de", "Autor", null],
];
for (const [lang, input, expected] of matches) {
  const got = resolveBank(lang, input);
  check(`[${lang}] "${input}" -> ${expected ?? "unknown"}`, got === expected, `got ${got}`);
}

// Bots must never answer in another language just because their own bank has a
// gap: Italian has no city starting with H, so the answer is nothing.
check(
  "no cross-language leak inside a known category",
  wordsFor("it", "city", "H").length === 0,
  wordsFor("it", "city", "H").join(","),
);
// A category set up in another language does borrow, though.
check("unknown-here categories borrow words", wordsFor("it", "videogame", "F").length > 0);

// A German label still resolves inside an English room, and the other way round.
check("cross-language fallback", resolveBank("en", "Tier") === "animal", `${resolveBank("en", "Tier")}`);

console.log("\nword banks");
for (const lang of LANGS) {
  const slugs = Object.keys(CATEGORY_LABELS[lang]);
  let thinnest = { slug: "", count: 99 };
  let mismatches = 0;
  for (const slug of slugs) {
    const bank = getBank(lang, slug);
    if (!bank) {
      failures++;
      console.log(`  FAIL [${lang}] missing bank: ${slug}`);
      continue;
    }
    const letters = Object.keys(bank);
    if (letters.length < thinnest.count) thinnest = { slug, count: letters.length };
    for (const [letter, words] of Object.entries(bank)) {
      for (const w of words) if (!startsWithLetter(w, letter)) mismatches++;
    }
  }
  check(`[${lang}] every category has a bank`, true);
  check(`[${lang}] every word matches its letter`, mismatches === 0, `${mismatches} off`);
  check(
    `[${lang}] thinnest bank still covers 15+ letters (${thinnest.slug})`,
    thinnest.count >= 15,
    `${thinnest.slug}: ${thinnest.count}`,
  );
  const usable = ALPHABET.filter((l) => !hardLetters(lang).includes(l));
  const gaps = usable.filter((l) => wordsFor(lang, "city", l).length === 0);
  check(`[${lang}] cities cover the playable letters`, gaps.length <= 2, `gaps: ${gaps.join(",")}`);
}

console.log("\nletter dice");
for (const lang of LANGS) {
  const excluded = hardLetters(lang);
  const used: string[] = [];
  const pool = ALPHABET.filter((l) => !excluded.includes(l));
  for (let i = 0; i < pool.length; i++) used.push(rollLetter(used, excluded));
  check(`[${lang}] rolls the whole pool without repeats`, new Set(used).size === pool.length);
  check(`[${lang}] never rolls an excluded letter`, used.every((l) => !excluded.includes(l)));
  check(`[${lang}] pool wraps around when exhausted`, ALPHABET.includes(rollLetter(used, excluded)));
}

console.log("\nbots");
for (const lang of LANGS) {
  const settings: GameSettings = {
    ...defaultSettings(lang),
    roundSeconds: 120,
    categories: [...defaultCategories(lang), makeCategory(lang, "Blorptrix")],
  };
  const bots = makeBots(3, "brutal", lang);
  check(`[${lang}] three distinct bots`, new Set(bots.map((b) => b.name)).size === 3);
  check(`[${lang}] bot names are localized`, bots.every((b) => b.name.length > 2));

  let filled = 0;
  let wrongLetter = 0;
  let overtime = 0;
  const letters = ALPHABET.filter((l) => !hardLetters(lang).includes(l)).slice(0, 6);
  for (const bot of bots) {
    for (const letter of letters) {
      const plan = planBotRound(bot, settings.categories, letter, settings);
      if (plan.fills.some((f) => f.atMs >= 120_000)) overtime++;
      const answers = answersAt(plan, 120_000);
      filled += Object.keys(answers).length;
      for (const word of Object.values(answers)) {
        if (!startsWithLetter(word, letter)) wrongLetter++;
      }
    }
  }
  const slots = bots.length * letters.length * settings.categories.length;
  check(`[${lang}] brutal bots fill most slots`, filled > slots * 0.5, `${filled}/${slots}`);
  check(`[${lang}] every bot answer starts with the round letter`, wrongLetter === 0, `${wrongLetter} wrong`);
  check(`[${lang}] bots always finish inside the round`, overtime === 0, `${overtime} late`);
}

// Archetypes are drawn at random, so compare the averages rather than one draw.
const avgSkill = (level: "chill" | "brutal") => {
  let sum = 0;
  for (let i = 0; i < 40; i++) sum += makeBots(1, level, "en")[0].skill ?? 0;
  return sum / 40;
};
check("brutal bots are sharper than chill bots", avgSkill("brutal") > avgSkill("chill") * 1.4);

console.log("\nscoring");
const cats = [
  { id: "city", name: "City" },
  { id: "country", name: "Country" },
  { id: "animal", name: "Animal" },
];
const settings = { ...defaultSettings("en"), categories: cats };
const result = scoreRound(
  "B",
  cats,
  ["p1", "p2", "p3"],
  {
    p1: { city: "Berlin", country: "Belgium", animal: "Bear" },
    p2: { city: "Berlin", country: "Brazil", animal: "" },
    p3: { city: "Bremen", country: "Austria", animal: "" },
  },
  settings,
);
const pts = (p: string, c: string) =>
  result.answers.find((a) => a.playerId === p && a.categoryId === c)?.points;
check("shared answer scores 5", pts("p1", "city") === 5, `${pts("p1", "city")}`);
check("unique answer scores 10", pts("p3", "city") === 10, `${pts("p3", "city")}`);
check("only answer in the category scores 20", pts("p1", "animal") === 20, `${pts("p1", "animal")}`);
check("wrong letter scores 0", pts("p3", "country") === 0, `${pts("p3", "country")}`);
check("empty scores 0", pts("p2", "animal") === 0);
check("totals add up", result.totals.p1 === 5 + 10 + 20, `${result.totals.p1}`);

const vetoed = scoreRound(
  "B",
  cats,
  ["p1", "p2"],
  { p1: { city: "Berlin" }, p2: { city: "Bielefeld" } },
  settings,
  { "p2:city": true },
);
check("a struck answer scores 0", vetoed.totals.p2 === 0);
check("striking promotes the survivor to 20", vetoed.totals.p1 === 20, `${vetoed.totals.p1}`);

console.log("\nword folding");
check("umlaut folding", foldWord("Köln") === foldWord("Koeln"));
check("accent folding", foldWord("Città") === foldWord("Citta"));
check("case and spaces ignored", foldWord("New York") === foldWord("new-york"));
check("Ä counts as A", startsWithLetter("Ärger", "A"));
check("Ü counts as U", startsWithLetter("Übung", "U"));
check("È counts as E", startsWithLetter("Èlite", "E"));
check("B is not A", !startsWithLetter("Berlin", "A"));

console.log("\ndefaults");
for (const lang of LANGS) {
  const s = defaultSettings(lang);
  check(`[${lang}] five starting categories`, s.categories.length === 5);
  check(`[${lang}] all starting categories are known`, s.categories.every((c) => !!getBank(lang, c.bank!)));
  check(`[${lang}] stop is on by default`, s.allowStop);
}

console.log(failures === 0 ? "\nall good\n" : `\n${failures} failing check(s)\n`);
process.exit(failures === 0 ? 0 : 1);
