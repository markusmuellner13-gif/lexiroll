# Wortjagd

**Stadt Land Fluss, neu gewürfelt.** Solo gegen Bots, die wirklich mitdenken — oder online mit
Freunden, egal auf welchem Gerät sie gerade sitzen.

<p align="center">
  <img src="public/icons/icon-192.png" width="96" alt="Wortjagd" />
</p>

## Was drin ist

- **🎲 Buchstabenwürfel** — jede Runde ein neuer Buchstabe, keine Wiederholungen, fiese Buchstaben
  (Q, X, Y, C) optional raus.
- **🤖 Solo gegen Bots** — zehn Bot-Charaktere mit eigenem Tempo und eigener Stärke (`chillig`,
  `normal`, `brutal`). Ohne Anmeldung, ohne Internet.
- **🌍 Online mit Freunden** — Raum aufmachen, vierstelligen Code teilen, von überall mitspielen.
  Bots dürfen in Online-Räumen mitspielen.
- **✏️ Freie Kategorien** — jede Kategorie lässt sich ersetzen oder neu erfinden. Die Bots stellen
  sich darauf ein (siehe unten).
- **🏅 Klassische Wertung** — 20 / 10 / 5 / 0 Punkte, plus eine Prüfrunde, in der alle faule
  Antworten streichen dürfen.
- **📱 PWA** — installierbar auf dem Homescreen, eigener Splashscreen, funktioniert solo offline.

## Wie sich die Bots an eigene Kategorien anpassen

Drei Stufen, in dieser Reihenfolge:

1. **Wortlisten im Code** — ~30 deutsche Kategorien (Stadt, Land, Fluss, Tier, Automarke,
   Videospiel, Süßigkeit …) liegen in [`lib/game/wordbank.ts`](lib/game/wordbank.ts). Eine
   Alias-Tabelle in [`lib/game/categories.ts`](lib/game/categories.ts) normalisiert Umlaute und
   Plurale, sodass `Städte`, `staedte` und `Lieblingsstadt` alle auf dieselbe Liste zeigen.
2. **Generierte Listen** — kennt die App eine Kategorie nicht (`Pizzabelag`, `Ausrede fürs
   Zuspätkommen`), fragt [`/api/bot-words`](app/api/bot-words/route.ts) die Claude API nach
   passenden Begriffen pro Buchstabe. Das Ergebnis wird in Turso und im Browser gecacht, also
   einmal pro Kategorie und nie wieder.
3. **Raten** — ohne API-Key raten die Bots aus einem generischen Substantiv-Pool. Im UI steht dann
   `🤖?` an der Kategorie, und ihre Antworten lassen sich in der Prüfrunde streichen. Nichts bricht,
   es wird nur weniger scharf.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Styles | Tailwind CSS 4 |
| Datenbank | Turso / libSQL (nur für den Online-Modus) |
| Hosting | Vercel |
| Bot-Wortlisten | Claude API (optional) |

Der Online-Modus läuft ohne Websockets: Der Serverzustand ist rein zeitbasiert und wird bei jedem
Request nachgezogen (`lib/rooms.ts`), Clients pollen. Das passt zu Serverless und übersteht
Verbindungsabbrüche, ohne dass eine Runde hängen bleibt.

## Lokal starten

```bash
npm install
npm run dev          # http://localhost:3000
```

Solo funktioniert sofort. Für den Online-Modus:

```bash
cp .env.example .env.local
# TURSO_DATABASE_URL und TURSO_AUTH_TOKEN eintragen
```

Die Tabellen legt die App beim ersten Request selbst an.

| Skript | Zweck |
|---|---|
| `npm run dev` | Dev-Server |
| `npm run build` | Produktions-Build |
| `npm test` | Smoke-Test für Kategorien, Bots und Wertung |
| `npm run icons` | Icons und Splashscreens aus einer SVG-Quelle rendern |

## Umgebungsvariablen

| Variable | Pflicht | Wofür |
|---|---|---|
| `TURSO_DATABASE_URL` | für Online-Modus | libSQL-Verbindung |
| `TURSO_AUTH_TOKEN` | für Online-Modus | Token dazu |
| `ANTHROPIC_API_KEY` | optional | Wortlisten für unbekannte Kategorien |

Fehlt Turso, versteckt die App den Online-Modus mit einem Hinweis — solo bleibt voll spielbar.

## Aufbau

```
app/
  api/rooms/…          Raum anlegen, Zustand lesen, Aktionen ausführen
  api/bot-words/       Wortlisten für neue Kategorien
  solo/ play/ room/    Spielmodi
lib/game/              Regeln: Würfel, Wortlisten, Bots, Wertung
lib/rooms.ts           Zustandsmaschine für Online-Räume
components/            Spieloberflächen
scripts/               Icon-Generator, Smoke-Test
```
