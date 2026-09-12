"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AVATARS, loadProfile, loadSettings, saveProfile, type Profile } from "@/lib/storage";
import { Button, Card } from "./ui";

export function PlayHub({ online }: { online: boolean }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  const update = (patch: Partial<Profile>) => {
    setProfile((p) => {
      if (!p) return p;
      const next = { ...p, ...patch };
      saveProfile(next);
      return next;
    });
  };

  const nameOk = (profile?.name ?? "").trim().length >= 2;

  const createRoom = async () => {
    if (!profile || !nameOk) return;
    setBusy("create");
    setError(null);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          playerId: profile.id,
          name: profile.name,
          emoji: profile.emoji,
          settings: loadSettings(),
        }),
      });
      const data = (await res.json()) as { code?: string; error?: string };
      if (!res.ok || !data.code) throw new Error(data.error ?? "Raum konnte nicht erstellt werden.");
      router.push(`/room/${data.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
      setBusy(null);
    }
  };

  const joinRoom = () => {
    const clean = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (clean.length < 4 || !nameOk) return;
    setBusy("join");
    router.push(`/room/${clean}`);
  };

  return (
    <div className="shell space-y-5 py-[calc(1.5rem+var(--safe-t))] pb-[calc(2rem+var(--safe-b))]">
      <div className="flex items-center gap-3">
        <Link href="/" className="grid h-10 w-10 place-items-center rounded-full bg-white/8 text-lg">
          ←
        </Link>
        <h1 className="text-2xl font-extrabold">Mit Freunden</h1>
      </div>

      {!online ? (
        <Card className="border-amber/40 bg-amber/10 p-4 text-sm">
          <strong className="block font-bold">Online-Modus ist gerade nicht verbunden.</strong>
          <span className="text-muted">
            Für Runden mit Freunden braucht die App eine Datenbank (Turso). Solo gegen Bots
            funktioniert trotzdem jederzeit.
          </span>
        </Card>
      ) : null}

      <Card className="space-y-4 p-4">
        <div>
          <h2 className="text-sm font-bold tracking-wide text-muted uppercase">Dein Gastprofil</h2>
          <p className="mt-1 text-xs text-muted">
            Kein Account, kein Passwort — nur ein Name, damit deine Freunde wissen, wer da mitspielt.
            Er bleibt auf diesem Gerät gespeichert.
          </p>
        </div>

        <input
          value={profile?.name ?? ""}
          onChange={(e) => update({ name: e.target.value.slice(0, 18) })}
          placeholder="Dein Name"
          maxLength={18}
          autoComplete="nickname"
          className="glass w-full rounded-2xl px-4 py-3.5 text-lg font-bold outline-none placeholder:text-white/25 focus:border-lime/50"
        />

        <div className="flex flex-wrap gap-2">
          {AVATARS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => update({ emoji: a })}
              aria-label={`Avatar ${a}`}
              className={`grid h-11 w-11 place-items-center rounded-2xl text-xl transition-all ${
                profile?.emoji === a ? "scale-105 bg-lime/25 ring-2 ring-lime" : "bg-white/8"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </Card>

      {error ? (
        <Card className="border-magenta/50 bg-magenta/10 p-4 text-sm font-semibold">{error}</Card>
      ) : null}

      <Button full size="lg" onClick={createRoom} disabled={!nameOk || busy !== null || !online}>
        {busy === "create" ? "Raum wird geöffnet…" : "Raum erstellen"}
      </Button>

      <Card className="space-y-3 p-4">
        <h2 className="text-sm font-bold tracking-wide text-muted uppercase">Raum beitreten</h2>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4))}
            onKeyDown={(e) => e.key === "Enter" && joinRoom()}
            placeholder="CODE"
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            className="glass min-w-0 flex-1 rounded-2xl px-4 py-3.5 text-center text-2xl font-extrabold tracking-[0.4em] outline-none placeholder:tracking-normal placeholder:text-white/20 focus:border-lime/50"
          />
          <Button
            variant="secondary"
            size="lg"
            onClick={joinRoom}
            disabled={code.trim().length < 4 || !nameOk || busy !== null}
          >
            Los
          </Button>
        </div>
        {!nameOk ? <p className="text-xs text-amber">Trag oben zuerst deinen Namen ein.</p> : null}
      </Card>
    </div>
  );
}
