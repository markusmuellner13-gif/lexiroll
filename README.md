# Lexiroll

**Roll a letter, fill the board.** The *Stadt Land Fluss* / *Nomi cose città* / *Categories* classic —
solo against bots that actually think, or online with friends on any device.

<p align="center">
  <img src="public/icons/icon-192.png" width="96" alt="Lexiroll" />
</p>

Plays in **English, German and Italian** — not just the interface, but the categories, the word
banks and the bots' vocabulary.

## What's in it

- **🎲 Letter die** — every round rolls a fresh letter with a proper tumble-and-land animation. No
  repeats within a game, and the awkward letters can be dropped (per language: `Q X Y C` in German,
  `Q X Y Z` in English, `J K W X Y` in Italian).
- **🤖 Solo vs bots** — ten bot characters with their own pace and sharpness, three difficulty
  levels. No account, no sign-up, works offline.
- **🌍 Online with friends** — open a room, share the four-letter code, play from anywhere. Bots can
  join online rooms too.
- **✏️ Your own categories** — replace any of them or invent new ones. The bots adapt (see below).
- **🏅 Classic scoring** — 20 / 10 / 5 / 0, plus a review phase where everyone can strike out lazy
  answers, bots included.
- **📱 PWA** — installable, own icon, 13 iOS startup images, and solo play works with no connection.

## How the bots adapt to your categories

Three tiers, in order:

1. **Built-in word banks** — ~30 categories per language (city, country, river, animal, car brand,
   video game, sweet …) live in [`lib/game/banks/`](lib/game/banks/). Bank keys are
   language-neutral slugs, so `Stadt` / `City` / `Città` all point at the same slug while the words
   stay native.
2. **Alias resolution** — [`lib/game/categories.ts`](lib/game/categories.ts) folds umlauts and
   accents, strips plurals and matches compound heads, so `Städte`, `cities`, `Lieblingstier` and
   `favourite animal` all land on the right bank. It matches whole labels, then single words, then
   compound *endings* only — which is why `Autor` does not become a car brand.
3. **Generated banks** — for a genuinely new category (`Pizza topping`, `Excuse for being late`),
   [`/api/bot-words`](app/api/bot-words/route.ts) asks the Claude API for words in the room's
   language. The result is cached in Turso and in the browser, so each category costs one request
   ever.

Without an API key nothing breaks: the bots guess from a generic noun pool, the category is marked
`🤖?` in the UI, and players can strike the nonsense in the review phase.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Styling | Tailwind CSS 4 |
| Database | Turso / libSQL — only for online rooms |
| Hosting | Vercel |
| Bot vocabulary | Claude API (optional) |

Online play uses no websockets. Room state is time-driven and advanced lazily on every request
([`lib/rooms.ts`](lib/rooms.ts)), and clients poll. That suits serverless and survives dropped
connections without a round ever getting stuck. Server failures travel as error codes, so each
client phrases them in its own language.

## Running it locally

```bash
npm install
npm run dev          # http://localhost:3000
```

Solo works immediately. For online rooms:

```bash
cp .env.example .env.local
# fill in TURSO_DATABASE_URL and TURSO_AUTH_TOKEN
```

The app creates its own tables on the first request.

| Script | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm test` | Smoke test: translations, category matching, word banks, bots, scoring |
| `npm run icons` | Render icons and iOS splash screens from one SVG source |

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `TURSO_DATABASE_URL` | for online play | libSQL connection |
| `TURSO_AUTH_TOKEN` | for online play | its token |
| `ANTHROPIC_API_KEY` | optional | word banks for invented categories |

With Turso missing, the app hides online play behind an explanatory notice — solo stays fully
playable.

## Adding a language

1. Add the code to `LANGS` in [`lib/i18n/types.ts`](lib/i18n/types.ts).
2. Copy [`lib/i18n/strings/de.ts`](lib/i18n/strings/de.ts) and translate it — the `Strings` type
   makes a missing key a compile error, and `npm test` checks it too.
3. Add a word-bank file under [`lib/game/banks/`](lib/game/banks/) using the same slugs.
4. Fill in `CATEGORY_LABELS`, `DEFAULT_SLUGS` and `EXTRA_ALIASES` in
   [`lib/game/categories.ts`](lib/game/categories.ts), plus `HARD_LETTERS` in
   [`lib/game/letters.ts`](lib/game/letters.ts) and a prompt in
   [`app/api/bot-words/route.ts`](app/api/bot-words/route.ts).

## Layout

```
app/
  api/rooms/…          create a room, read state, apply actions
  api/bot-words/       word banks for new categories
  solo/ play/ room/    game modes
lib/game/              rules: die, word banks, bots, scoring
lib/i18n/              languages, strings, provider
lib/rooms.ts           state machine for online rooms
components/            game surfaces
scripts/               icon generator, smoke test
```
