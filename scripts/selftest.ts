/**
 * Smoke test for the game core: category matching, bot behaviour and scoring.
 * Run with `npm test`.
 */
import { makeCategory, resolveBank } from "../lib/game/categories";
import { answersAt, makeBots, planBotRound } from "../lib/game/bots";
import { rollLetter, ALPHABET, HARD_LETTERS } from "../lib/game/letters";
import { scoreRound, foldWord, startsWithLetter } from "../lib/game/scoring";
import { DEFAULT_SETTINGS, type GameSettings } from "../lib/game/types";
import { DEFAULT_CATEGORIES } from "../lib/game/categories";

let failures = 0;
function check(label: string, condition: boolean, detail = "") {
  if (condition) {
    console.log(`  ok   ${label}`);
  } else {
    failures++;
    console.log(`  FAIL ${label}${detail ? ` - ${detail}` : ""}`);
  }
}

console.log("\ncategory matching");
const matches: [string, string | null][] = [
  ["Stadt", "stadt"],
  ["Städte", "stadt"],
  ["staedte", "stadt"],
  ["LÄNDER", "land"],
  ["Tiere", "tier"],
  ["Lieblingstier", "tier"],
  ["Automarke", "automarke"],
  ["Süßigkeiten", "suessigkeit"],
  ["Musikinstrument", "instrument"],
  ["Berufe", "beruf"],
  ["Videospiele", "videospiel"],
  ["Kleidungsstück", "kleidung"],
  ["Quantenfeldtheorie", null],
];
for (const [input, expected] of matches) {
  const got = resolveBank(input);
  check(`"${input}" -> ${expected ?? "unbekannt"}`, got === expected, `got ${got}`);
}

console.log("\nletter dice");
const excluded = HARD_LETTERS;
const used: string[] = [];
for (let i = 0; i < 22; i++) used.push(rollLetter(used, excluded));
check("22 rolls are all different", new Set(used).size === 22, `got ${new Set(used).size}`);
check("never rolls an excluded letter", used.every((l) => !excluded.includes(l)));
check("pool wraps around when exhausted", ALPHABET.includes(rollLetter(used, excluded)));

console.log("\nbots");
const settings: GameSettings = {
  ...DEFAULT_SETTINGS,
  roundSeconds: 120,
  categories: [...DEFAULT_CATEGORIES, makeCategory("Pizzabelag")],
};
const bots = makeBots(3, "brutal");
check("three distinct bots", new Set(bots.map((b) => b.name)).size === 3);

let filledTotal = 0;
let wrongLetter = 0;
for (const bot of bots) {
  for (const letter of ["A", "B", "S", "M", "T"]) {
    const plan = planBotRound(bot, settings.categories, letter, settings);
    const answers = answersAt(plan, 120_000);
    filledTotal += Object.keys(answers).length;
    for (const word of Object.values(answers)) {
      if (!startsWithLetter(word, letter)) wrongLetter++;
    }
    check(
      `${bot.name} finishes within the round limit (${letter})`,
      plan.fills.every((f) => f.atMs < 120_000),
    );
  }
}
check("brutal bots fill most slots", filledTotal > 3 * 5 * 5 * 0.6, `${filledTotal}/90`);
check("every bot answer starts with the round letter", wrongLetter === 0, `${wrongLetter} wrong`);

const chill = makeBots(1, "chill")[0];
const brutal = makeBots(1, "brutal")[0];
check("brutal bots are sharper than chill bots", (brutal.skill ?? 0) > (chill.skill ?? 1));

console.log("\nscoring");
const cats = [
  { id: "stadt", name: "Stadt" },
  { id: "land", name: "Land" },
  { id: "tier", name: "Tier" },
];
const result = scoreRound(
  "B",
  cats,
  ["p1", "p2", "p3"],
  {
    p1: { stadt: "Berlin", land: "Belgien", tier: "Biber" },
    p2: { stadt: "Berlin", land: "Brasilien", tier: "" },
    p3: { stadt: "Bremen", land: "Aachen", tier: "" },
  },
  { ...DEFAULT_SETTINGS, categories: cats },
);
const pts = (p: string, c: string) => result.answers.find((a) => a.playerId === p && a.categoryId === c)?.points;
check("shared answer scores 5", pts("p1", "stadt") === 5, `${pts("p1", "stadt")}`);
check("unique answer scores 10", pts("p3", "stadt") === 10, `${pts("p3", "stadt")}`);
check("only answer in the category scores 20", pts("p1", "tier") === 20, `${pts("p1", "tier")}`);
check("wrong letter scores 0", pts("p3", "land") === 0, `${pts("p3", "land")}`);
check("empty scores 0", pts("p2", "tier") === 0);
check("totals add up", result.totals.p1 === 5 + 10 + 20, `${result.totals.p1}`);

const vetoed = scoreRound(
  "B",
  cats,
  ["p1", "p2"],
  { p1: { stadt: "Berlin" }, p2: { stadt: "Bielefeld" } },
  { ...DEFAULT_SETTINGS, categories: cats },
  { "p2:stadt": true },
);
check("a struck answer scores 0", vetoed.totals.p2 === 0);
check("striking promotes the survivor to 20", vetoed.totals.p1 === 20, `${vetoed.totals.p1}`);

console.log("\nword folding");
check("umlaut folding", foldWord("Köln") === foldWord("Koeln"));
check("case and spaces ignored", foldWord("New York") === foldWord("new-york"));
check("Ä counts as A", startsWithLetter("Ärger", "A"));
check("Ü counts as U", startsWithLetter("Übung", "U"));
check("B is not A", !startsWithLetter("Berlin", "A"));

console.log(failures === 0 ? "\nall good\n" : `\n${failures} failing check(s)\n`);
process.exit(failures === 0 ? 0 : 1);
