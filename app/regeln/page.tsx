import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Regeln" };

const RULES: { title: string; body: string }[] = [
  {
    title: "Der Würfel bestimmt",
    body: "Jede Runde würfelt die App einen Buchstaben. Buchstaben, die schon dran waren, kommen nicht nochmal — und Q, X, Y und C kannst du komplett rauswerfen.",
  },
  {
    title: "Alle schreiben gleichzeitig",
    body: "Zu jeder Kategorie ein Wort, das mit dem Buchstaben beginnt. Ä zählt als A, Ö als O, Ü als U.",
  },
  {
    title: "Stopp beendet die Runde",
    body: "Wer als Erster alles ausgefüllt hat, darf STOPP drücken. Alle anderen haben dann noch drei Sekunden.",
  },
  {
    title: "Punkte",
    body: "20 Punkte, wenn du als Einzige(r) etwas hast. 10 Punkte für eine Antwort, die sonst niemand hatte. 5 Punkte, wenn ihr dasselbe geschrieben habt. 0 für leer, falschen Buchstaben oder gestrichen.",
  },
  {
    title: "Prüfrunde",
    body: "Nach jeder Runde sieht jeder alle Antworten und darf zweifelhafte streichen. Gestrichen wird, was die Mehrheit der Mitspieler streicht — auch bei Bots.",
  },
  {
    title: "Eigene Kategorien",
    body: "Du kannst jede Kategorie ersetzen oder eigene erfinden. Für bekannte Kategorien haben die Bots echtes Wissen; für neue lernen sie dazu, und wo sie raten, erkennst du das am 🤖?-Symbol.",
  },
  {
    title: "Solo und mit Freunden",
    body: "Solo läuft komplett auf deinem Gerät — ohne Anmeldung, ohne Internet. Für Runden mit Freunden reicht ein Name: Raum aufmachen, Code teilen, fertig.",
  },
];

export default function Page() {
  return (
    <div className="shell max-w-2xl space-y-6 py-[calc(1.5rem+var(--safe-t))] pb-[calc(2rem+var(--safe-b))]">
      <div className="flex items-center gap-3">
        <Link href="/" className="grid h-10 w-10 place-items-center rounded-full bg-white/8 text-lg">
          ←
        </Link>
        <h1 className="text-2xl font-extrabold">Regeln</h1>
      </div>

      <ol className="space-y-3">
        {RULES.map((rule, i) => (
          <li key={rule.title} className="glass rounded-3xl p-5">
            <div className="flex items-baseline gap-3">
              <span className="text-sm font-extrabold text-lime tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="text-lg font-bold">{rule.title}</h2>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{rule.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
