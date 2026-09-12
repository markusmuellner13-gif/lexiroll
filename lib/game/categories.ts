import type { Lang } from "../i18n/types";
import { LANGS } from "../i18n/types";
import type { Category } from "./types";
import { hasBank } from "./wordbank";

/** Display names for the built-in bank slugs. */
export const CATEGORY_LABELS: Record<Lang, Record<string, string>> = {
  de: {
    city: "Stadt", country: "Land", river: "Fluss", name: "Name", job: "Beruf",
    animal: "Tier", plant: "Pflanze", food: "Essen", color: "Farbe", brand: "Marke",
    band: "Band / Musiker", movie: "Film", series: "Serie", sport: "Sportart",
    bodypart: "Körperteil", object: "Gegenstand", clothing: "Kleidungsstück",
    carbrand: "Automarke", drink: "Getränk", hobby: "Hobby", subject: "Schulfach",
    superhero: "Superheld", game: "Spiel", instrument: "Instrument", sweet: "Süßigkeit",
    furniture: "Möbelstück", island: "Insel", capital: "Hauptstadt", videogame: "Videospiel",
    tool: "Werkzeug", feeling: "Gefühl",
  },
  en: {
    city: "City", country: "Country", river: "River", name: "Name", job: "Job",
    animal: "Animal", plant: "Plant", food: "Food", color: "Colour", brand: "Brand",
    band: "Band / artist", movie: "Movie", series: "TV series", sport: "Sport",
    bodypart: "Body part", object: "Object", clothing: "Clothing",
    carbrand: "Car brand", drink: "Drink", hobby: "Hobby", subject: "School subject",
    superhero: "Superhero", game: "Game", instrument: "Instrument", sweet: "Sweet",
    furniture: "Furniture", island: "Island", capital: "Capital city", videogame: "Video game",
    tool: "Tool", feeling: "Feeling",
  },
  it: {
    city: "Città", country: "Paese", river: "Fiume", name: "Nome", job: "Mestiere",
    animal: "Animale", plant: "Pianta", food: "Cibo", color: "Colore", brand: "Marca",
    band: "Band / cantante", movie: "Film", series: "Serie TV", sport: "Sport",
    bodypart: "Parte del corpo", object: "Cosa", clothing: "Capo di abbigliamento",
    carbrand: "Marca di auto", drink: "Bevanda", hobby: "Hobby", subject: "Materia",
    superhero: "Supereroe", game: "Gioco", instrument: "Strumento", sweet: "Dolce",
    furniture: "Mobile", island: "Isola", capital: "Capitale", videogame: "Videogioco",
    tool: "Attrezzo", feeling: "Sentimento",
  },
};

/** The classic starting five, as each language plays it. */
const DEFAULT_SLUGS: Record<Lang, string[]> = {
  de: ["city", "country", "river", "name", "job"],
  en: ["city", "country", "river", "name", "job"],
  // "Nomi, cose, città" - the Italian classic.
  it: ["name", "object", "city", "animal", "job"],
};

const SUGGESTION_ORDER = [
  "animal", "plant", "food", "color", "brand", "band", "movie", "series", "sport",
  "bodypart", "object", "clothing", "carbrand", "drink", "hobby", "subject",
  "superhero", "game", "instrument", "sweet", "furniture", "island", "capital",
  "videogame", "tool", "feeling", "city", "country", "river", "name", "job",
];

export function defaultCategories(lang: Lang): Category[] {
  return DEFAULT_SLUGS[lang].map((slug) => ({
    id: slug,
    name: CATEGORY_LABELS[lang][slug],
    bank: slug,
  }));
}

export function suggestedCategories(lang: Lang): { name: string; bank: string }[] {
  return SUGGESTION_ORDER.filter((slug) => !DEFAULT_SLUGS[lang].includes(slug)).map((slug) => ({
    name: CATEGORY_LABELS[lang][slug],
    bank: slug,
  }));
}

/** Extra words players actually type, beyond the official labels. */
const EXTRA_ALIASES: Record<Lang, Record<string, string>> = {
  de: {
    stadte: "city", ort: "city", grosstadt: "city", lander: "country", staat: "country",
    nation: "country", gewasser: "river", see: "river", meer: "river", vorname: "name",
    madchenname: "name", jungenname: "name", spitzname: "name", tiere: "animal",
    haustier: "animal", saugetier: "animal", wildtier: "animal", zootier: "animal",
    berufe: "job", traumberuf: "job", handwerk: "job", blume: "plant", baum: "plant",
    kraut: "plant", speise: "food", gericht: "food", lebensmittel: "food", obst: "food",
    gemuse: "food", pizzabelag: "food", farben: "color", farbton: "color", firma: "brand",
    unternehmen: "brand", logo: "brand", musiker: "band", sanger: "band", kunstler: "band",
    rapper: "band", promi: "band", star: "band", filme: "movie", kinofilm: "movie",
    serien: "series", netflixserie: "series", anime: "series", sportart: "sport",
    sportler: "sport", organ: "bodypart", knochen: "bodypart", ding: "object",
    sache: "object", objekt: "object", klamotten: "clothing", mode: "clothing",
    schuh: "clothing", auto: "carbrand", autohersteller: "carbrand", drink: "drink",
    cocktail: "drink", alkohol: "drink", freizeit: "hobby", fach: "subject",
    unterrichtsfach: "subject", studienfach: "subject", held: "superhero",
    comicheld: "superhero", brettspiel: "game", gesellschaftsspiel: "game",
    kartenspiel: "game", musikinstrument: "instrument", snack: "sweet",
    schokolade: "sweet", nascherei: "sweet", einrichtung: "furniture",
    urlaubsinsel: "island", computerspiel: "videogame", pcspiel: "videogame",
    konsolenspiel: "videogame", emotion: "feeling", stimmung: "feeling",
    werkzeuge: "tool", schauspieler: "movie",
  },
  en: {
    cities: "city", town: "city", place: "city", countries: "country", nation: "country",
    state: "country", rivers: "river", lake: "river", sea: "river", water: "river",
    names: "name", firstname: "name", boysname: "name", girlsname: "name",
    animals: "animal", pet: "animal", mammal: "animal", bird: "animal", jobs: "job",
    profession: "job", occupation: "job", career: "job", plants: "plant", flower: "plant",
    tree: "plant", herb: "plant", meal: "food", dish: "food", fruit: "food",
    vegetable: "food", snack: "food", pizzatopping: "food", colours: "color",
    colors: "color", color: "color", brands: "brand", company: "brand", logo: "brand",
    artist: "band", singer: "band", musician: "band", rapper: "band", celebrity: "band",
    movies: "movie", film: "movie", films: "movie", actor: "movie", show: "series",
    tvshow: "series", sports: "sport", athlete: "sport", organ: "bodypart",
    bone: "bodypart", thing: "object", item: "object", stuff: "object",
    clothes: "clothing", garment: "clothing", fashion: "clothing", shoe: "clothing",
    car: "carbrand", carmaker: "carbrand", drinks: "drink", cocktail: "drink",
    beverage: "drink", alcohol: "drink", hobbies: "hobby", pastime: "hobby",
    subject: "subject", schoolsubject: "subject", hero: "superhero", comic: "superhero",
    boardgame: "game", cardgame: "game", games: "game", instruments: "instrument",
    candy: "sweet", sweets: "sweet", dessert: "sweet", chocolate: "sweet",
    furniture: "furniture", islands: "island", capitals: "capital",
    videogames: "videogame", computergame: "videogame", pcgame: "videogame",
    tools: "tool", emotion: "feeling", feelings: "feeling", mood: "feeling",
  },
  it: {
    citta: "city", paesi: "country", nazione: "country", stato: "country",
    fiumi: "river", lago: "river", mare: "river", nomi: "name", nomedipersona: "name",
    animali: "animal", bestia: "animal", mestieri: "job", lavoro: "job",
    professione: "job", piante: "plant", fiore: "plant", albero: "plant",
    alimento: "food", piatto: "food", frutta: "food", verdura: "food",
    condimentopizza: "food", colori: "color", marche: "brand", azienda: "brand",
    cantante: "band", musicista: "band", artista: "band", rapper: "band",
    personaggiofamoso: "band", attore: "movie", pellicola: "movie", serietv: "series",
    telefilm: "series", anime: "series", sportivo: "sport", organo: "bodypart",
    osso: "bodypart", cose: "object", oggetto: "object", roba: "object",
    vestito: "clothing", vestiti: "clothing", abbigliamento: "clothing",
    scarpa: "clothing", auto: "carbrand", macchina: "carbrand", automobile: "carbrand",
    bevande: "drink", bibita: "drink", cocktail: "drink", alcolico: "drink",
    passatempo: "hobby", materie: "subject", materiascolastica: "subject",
    eroe: "superhero", fumetto: "superhero", giochi: "game", giocodatavolo: "game",
    strumentomusicale: "instrument", dolci: "sweet", dessert: "sweet",
    caramella: "sweet", cioccolato: "sweet", mobili: "furniture", arredamento: "furniture",
    isole: "island", capitali: "capital", videogiochi: "videogame",
    giocopercomputer: "videogame", attrezzi: "tool", utensile: "tool",
    emozione: "feeling", sentimenti: "feeling", umore: "feeling",
  },
};

/**
 * Lowercases, folds German umlauts and Italian accents and drops everything
 * that is not a letter, so "Städte 🌍", "staedte" and "città" all compare
 * the way a player would expect.
 */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ß/g, "s")
    .replace(/ae/g, "a")
    .replace(/oe/g, "o")
    .replace(/ue/g, "u")
    .replace(/[^a-z]/g, "");
}

/** Alias tables, built once from the labels plus the curated extras. */
const ALIASES: Record<Lang, Record<string, string>> = (() => {
  const built = {} as Record<Lang, Record<string, string>>;
  for (const lang of LANGS) {
    const table: Record<string, string> = {};
    for (const [slug, label] of Object.entries(CATEGORY_LABELS[lang])) {
      table[normalize(label)] = slug;
      // "Band / Musiker" also answers to each half on its own.
      for (const part of label.split(/[/,]/)) {
        const key = normalize(part);
        if (key.length >= 3) table[key] = slug;
      }
      table[slug] = slug;
    }
    Object.assign(table, EXTRA_ALIASES[lang]);
    built[lang] = table;
  }
  return built;
})();

/** Candidate singular forms for a normalized plural. */
function singulars(word: string): string[] {
  const out = [word];
  for (const suffix of ["innen", "nen", "en", "er", "ies", "es", "e", "n", "s", "i"]) {
    if (word.length > suffix.length + 2 && word.endsWith(suffix)) {
      out.push(word.slice(0, -suffix.length));
    }
  }
  if (word.endsWith("ies") && word.length > 5) out.push(`${word.slice(0, -3)}y`);
  return out;
}

/**
 * Maps a category label onto a bank slug so the bots know what to answer.
 * The player's own language wins; the others are tried as a fallback so a
 * mixed-language room still works. Returns null for genuinely new categories.
 */
export function resolveBank(lang: Lang, name: string): string | null {
  const n = normalize(name);
  if (!n) return null;

  const order: Lang[] = [lang, ...LANGS.filter((l) => l !== lang)];
  const tables = order.map((l) => ALIASES[l]);

  // 1. The whole label, including plural forms.
  for (const table of tables) {
    for (const candidate of singulars(n)) {
      if (table[candidate]) return table[candidate];
    }
  }

  // 2. Individual words: "favourite animal", "citta italiana", "Tier mit Fell".
  const tokens = name
    .split(/[s/,;:()–—-]+/)
    .map(normalize)
    .filter((t) => t.length >= 3);
  for (const table of tables) {
    for (const token of tokens) {
      for (const candidate of singulars(token)) {
        if (table[candidate]) return table[candidate];
      }
    }
  }

  // 3. Compounds put the head noun last ("Lieblingstier" -> Tier). Matching on
  //    the ending only, never anywhere inside, keeps "Autor" from becoming a
  //    car brand.
  let best: { key: string; len: number } | null = null;
  for (const table of tables) {
    for (const [alias, slug] of Object.entries(table)) {
      if (alias.length < 4) continue;
      const hit = n.endsWith(alias) || tokens.some((t) => t.endsWith(alias));
      if (hit && (!best || alias.length > best.len)) best = { key: slug, len: alias.length };
    }
    if (best) break;
  }
  return best?.key ?? null;
}

let counter = 0;
export function makeCategory(lang: Lang, name: string): Category {
  const trimmed = name.trim();
  const bank = resolveBank(lang, trimmed);
  return {
    id: `${bank ?? (normalize(trimmed) || "cat")}-${Date.now().toString(36)}-${counter++}`,
    name: trimmed,
    bank,
    custom: true,
  };
}

/** True when the bots have real domain knowledge for this category. */
export function isKnown(lang: Lang, category: Category): boolean {
  return hasBank(lang, category.bank);
}
