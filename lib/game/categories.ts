import type { Category } from "./types";
import { hasBank } from "./wordbank";

/** The classic five. Everything here is editable by the player. */
export const DEFAULT_CATEGORIES: Category[] = [
  { id: "stadt", name: "Stadt", bank: "stadt" },
  { id: "land", name: "Land", bank: "land" },
  { id: "fluss", name: "Fluss", bank: "fluss" },
  { id: "name", name: "Name", bank: "name" },
  { id: "beruf", name: "Beruf", bank: "beruf" },
];

/** Ready-made extras the player can add with one tap. */
export const SUGGESTED_CATEGORIES: { name: string; bank: string }[] = [
  { name: "Tier", bank: "tier" },
  { name: "Pflanze", bank: "pflanze" },
  { name: "Essen", bank: "essen" },
  { name: "Farbe", bank: "farbe" },
  { name: "Marke", bank: "marke" },
  { name: "Band / Musiker", bank: "band" },
  { name: "Film", bank: "film" },
  { name: "Serie", bank: "serie" },
  { name: "Sportart", bank: "sport" },
  { name: "Koerperteil", bank: "koerperteil" },
  { name: "Gegenstand", bank: "gegenstand" },
  { name: "Kleidungsstueck", bank: "kleidung" },
  { name: "Automarke", bank: "automarke" },
  { name: "Getraenk", bank: "getraenk" },
  { name: "Hobby", bank: "hobby" },
  { name: "Schulfach", bank: "schulfach" },
  { name: "Superheld", bank: "superheld" },
  { name: "Spiel", bank: "spiel" },
  { name: "Instrument", bank: "instrument" },
  { name: "Suessigkeit", bank: "suessigkeit" },
  { name: "Moebelstueck", bank: "moebel" },
  { name: "Insel", bank: "insel" },
  { name: "Hauptstadt", bank: "hauptstadt" },
  { name: "Videospiel", bank: "videospiel" },
  { name: "Werkzeug", bank: "werkzeug" },
  { name: "Gefuehl", bank: "gefuehl" },
];

/**
 * Free-text category names players type map onto a word bank through here.
 * Keys are normalized (see `normalize`), so "Städte", "staedte" and "STADT"
 * all land on the same entry.
 */
const ALIASES: Record<string, string> = {
  stadt: "stadt", stadte: "stadt", city: "stadt", ort: "stadt", grosstadt: "stadt", grosstadte: "stadt",
  land: "land", lander: "land", country: "land", staat: "land", staaten: "land", nation: "land",
  fluss: "fluss", flusse: "fluss", gewasser: "fluss", river: "fluss", see: "fluss", meer: "fluss",
  name: "name", vorname: "name", madchenname: "name", jungenname: "name", spitzname: "name",
  tier: "tier", tiere: "tier", animal: "tier", haustier: "tier", saugetier: "tier", wildtier: "tier", vogel: "tier", zootier: "tier",
  beruf: "beruf", berufe: "beruf", job: "beruf", traumberuf: "beruf", handwerk: "beruf",
  pflanze: "pflanze", pflanzen: "pflanze", blume: "pflanze", blumen: "pflanze", baum: "pflanze", baume: "pflanze", kraut: "pflanze",
  essen: "essen", speise: "essen", gericht: "essen", lebensmittel: "essen", nahrung: "essen", food: "essen", obst: "essen", gemuse: "essen", fruht: "essen", pizzabelag: "essen",
  farbe: "farbe", farben: "farbe", color: "farbe", farbton: "farbe",
  marke: "marke", marken: "marke", brand: "marke", firma: "marke", unternehmen: "marke", logo: "marke",
  band: "band", bands: "band", musiker: "band", sanger: "band", kunstler: "band", musikband: "band", rapper: "band", dj: "band",
  film: "film", filme: "film", movie: "film", kinofilm: "film", disneyfilm: "film",
  serie: "serie", serien: "serie", netflixserie: "serie", tvserie: "serie", anime: "serie",
  sport: "sport", sportart: "sport", sportarten: "sport", sportler: "sport",
  korperteil: "koerperteil", korperteile: "koerperteil", organ: "koerperteil", knochen: "koerperteil",
  gegenstand: "gegenstand", gegenstande: "gegenstand", ding: "gegenstand", sache: "gegenstand", objekt: "gegenstand", haushaltsgegenstand: "gegenstand",
  kleidung: "kleidung", kleidungsstuck: "kleidung", klamotten: "kleidung", mode: "kleidung", schuh: "kleidung",
  automarke: "automarke", auto: "automarke", autos: "automarke", autohersteller: "automarke", fahrzeugmarke: "automarke",
  getrank: "getraenk", getranke: "getraenk", drink: "getraenk", cocktail: "getraenk", alkohol: "getraenk",
  hobby: "hobby", hobbys: "hobby", freizeit: "hobby", freizeitaktivitat: "hobby",
  schulfach: "schulfach", schulfacher: "schulfach", fach: "schulfach", unterrichtsfach: "schulfach", studienfach: "schulfach",
  superheld: "superheld", superhelden: "superheld", held: "superheld", comicheld: "superheld", marvelfigur: "superheld",
  spiel: "spiel", spiele: "spiel", brettspiel: "spiel", gesellschaftsspiel: "spiel", kartenspiel: "spiel",
  instrument: "instrument", instrumente: "instrument", musikinstrument: "instrument",
  susigkeit: "suessigkeit", susigkeiten: "suessigkeit", subigkeit: "suessigkeit", snack: "suessigkeit", schokolade: "suessigkeit", nascherei: "suessigkeit",
  mobel: "moebel", mobelstuck: "moebel", einrichtung: "moebel", furniture: "moebel",
  insel: "insel", inseln: "insel", urlaubsinsel: "insel",
  hauptstadt: "hauptstadt", hauptstadte: "hauptstadt", capital: "hauptstadt",
  videospiel: "videospiel", videospiele: "videospiel", computerspiel: "videospiel", game: "videospiel", games: "videospiel", pcspiel: "videospiel", konsolenspiel: "videospiel",
  werkzeug: "werkzeug", werkzeuge: "werkzeug", tool: "werkzeug", baumarktartikel: "werkzeug",
  gefuhl: "gefuehl", gefuhle: "gefuehl", emotion: "gefuehl", emotionen: "gefuehl", stimmung: "gefuehl",
  promi: "band", promis: "band", star: "band", stars: "band", beruhmtheit: "band", schauspieler: "film",
};

/**
 * Lowercases, folds umlauts and strips everything that is not a letter, so
 * user input like "Städte 🌍" and "staedte" compare equal.
 */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ß/g, "s")
    .replace(/ae/g, "a")
    .replace(/oe/g, "o")
    .replace(/ue/g, "u")
    .replace(/[^a-z]/g, "");
}

/** Candidate singular forms for a normalized German plural. */
function singulars(word: string): string[] {
  const out = [word];
  for (const suffix of ["innen", "nen", "en", "er", "se", "e", "n", "s"]) {
    if (word.length > suffix.length + 2 && word.endsWith(suffix)) {
      out.push(word.slice(0, -suffix.length));
    }
  }
  return out;
}

/**
 * Maps a category label onto a word bank key so the bots know what to answer.
 * Returns null for genuinely unknown categories - those get a generated bank
 * (see /api/bot-words) or the generic fallback.
 */
export function resolveBank(name: string): string | null {
  const n = normalize(name);
  if (!n) return null;

  for (const candidate of singulars(n)) {
    if (ALIASES[candidate]) return ALIASES[candidate];
    if (hasBank(candidate)) return candidate;
  }

  // "Lieblingstier", "Tier mit Fell", "deutsche Stadt" - find a known token inside.
  let best: { key: string; len: number } | null = null;
  for (const [alias, bank] of Object.entries(ALIASES)) {
    if (alias.length >= 4 && n.includes(alias) && (!best || alias.length > best.len)) {
      best = { key: bank, len: alias.length };
    }
  }
  return best?.key ?? null;
}

let counter = 0;
export function makeCategory(name: string): Category {
  const trimmed = name.trim();
  const bank = resolveBank(trimmed);
  return {
    id: `${normalize(trimmed) || "kat"}-${Date.now().toString(36)}-${counter++}`,
    name: trimmed,
    bank,
    custom: true,
  };
}

/** True when the bots have real domain knowledge for this category. */
export function isKnown(category: Category): boolean {
  return hasBank(category.bank);
}
