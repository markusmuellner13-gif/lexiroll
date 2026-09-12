"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { RoomState } from "@/lib/rooms";
import type { Action } from "@/lib/rooms";
import type { Answers, GameSettings } from "@/lib/game/types";
import { hydrateCachedBanks, useBotTraining } from "@/lib/botbanks";
import { loadProfile, recordGame, type Profile } from "@/lib/storage";
import { AnswerSheet } from "./AnswerSheet";
import { CategoryEditor } from "./CategoryEditor";
import { FinalSheet } from "./FinalSheet";
import { LetterDice } from "./LetterDice";
import { Mark } from "./Logo";
import { ResultsSheet } from "./ResultsSheet";
import { ReviewSheet } from "./ReviewSheet";
import { SettingsPanel } from "./SettingsPanel";
import { Button, Card, Chip } from "./ui";

const POLL_FAST = 1100;
const POLL_SLOW = 2400;

export function RoomGame({ code }: { code: string }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [state, setState] = useState<RoomState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);

  const offset = useRef(0);
  const stateRef = useRef<RoomState | null>(null);
  stateRef.current = state;
  const answersRef = useRef<Answers>({});
  answersRef.current = answers;
  const currentRound = useRef(0);
  const submitted = useRef(false);
  const recorded = useRef(false);

  const serverNow = useCallback(() => Date.now() + offset.current, []);

  useEffect(() => {
    hydrateCachedBanks();
    setProfile(loadProfile());
  }, []);

  const apply = useCallback((next: RoomState) => {
    offset.current = next.serverNow - Date.now();
    setState(next);
    if (next.round && next.round.no !== currentRound.current) {
      currentRound.current = next.round.no;
      setAnswers({});
      submitted.current = false;
    }
  }, []);

  const call = useCallback(
    async (action: Action) => {
      if (!profile) return;
      try {
        const res = await fetch(`/api/rooms/${code}/action`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ playerId: profile.id, action }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError((data as { error?: string }).error ?? "Aktion fehlgeschlagen.");
          return;
        }
        if (action.type !== "leave") apply(data as RoomState);
      } catch {
        setError("Keine Verbindung. Versuche es nochmal.");
      }
    },
    [code, profile, apply],
  );

  // Join once, then poll.
  useEffect(() => {
    if (!profile) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;

    const join = async () => {
      try {
        const res = await fetch(`/api/rooms/${code}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ playerId: profile.id, name: profile.name, emoji: profile.emoji }),
        });
        const data = await res.json();
        if (!alive) return;
        if (!res.ok) {
          setError((data as { error?: string }).error ?? "Raum nicht gefunden.");
          return;
        }
        apply(data as RoomState);
        poll();
      } catch {
        if (alive) setError("Keine Verbindung zum Raum.");
      }
    };

    const poll = async () => {
      try {
        const res = await fetch(`/api/rooms/${code}?playerId=${encodeURIComponent(profile.id)}`, {
          cache: "no-store",
        });
        if (res.ok && alive) apply((await res.json()) as RoomState);
      } catch {
        /* a dropped poll is not worth an error banner */
      }
      if (!alive) return;
      const phase = stateRef.current?.phase;
      timer = setTimeout(poll, phase === "playing" ? POLL_SLOW : POLL_FAST);
    };

    join();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [profile, code, apply]);


  // Local clock for the countdown.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  // Push a draft so progress shows up for everyone and nothing is lost on a crash.
  useEffect(() => {
    if (state?.phase !== "playing" || submitted.current) return;
    const id = setTimeout(() => {
      if (Object.keys(answersRef.current).length) void call({ type: "draft", answers: answersRef.current });
    }, 1600);
    return () => clearTimeout(id);
  }, [answers, state?.phase, call]);

  const learning = useBotTraining(state?.settings.categories ?? [], (updates) => {
    setState((s) => {
      if (!s) return s;
      const map = new Map(updates.map((u) => [u.id, u.bank]));
      return {
        ...s,
        settings: {
          ...s.settings,
          categories: s.settings.categories.map((c) => (map.has(c.id) ? { ...c, bank: map.get(c.id)! } : c)),
        },
      };
    });
  });

  const me = state?.players.find((p) => p.id === profile?.id) ?? null;
  const isHost = !!state && !!profile && state.hostId === profile.id;

  const shareUrl = useMemo(
    () => (typeof window === "undefined" ? "" : `${window.location.origin}/room/${code}`),
    [code],
  );

  const share = async () => {
    const text = `Spiel Wortjagd mit mir! Raum-Code: ${code}`;
    if (navigator.share) {
      await navigator.share({ title: "Wortjagd", text, url: shareUrl }).catch(() => {});
      return;
    }
    await navigator.clipboard.writeText(`${text}\n${shareUrl}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const submit = useCallback(
    (stop: boolean) => {
      if (submitted.current) return;
      submitted.current = true;
      void call({ type: "submit", answers: answersRef.current, stop });
    },
    [call],
  );

  // Hard deadline reached and the player never pressed anything: hand in for them.
  useEffect(() => {
    if (state?.phase !== "playing" || !state.round?.deadline || submitted.current) return;
    if (serverNow() >= state.round.deadline) submit(false);
  }, [now, state, submit, serverNow]);

  // Record the solo-stats line once when a game ends.
  useEffect(() => {
    if (state?.phase !== "final" || recorded.current || !me) return;
    recorded.current = true;
    const best = Math.max(...state.players.map((p) => p.score));
    recordGame(me.score === best, me.score, state.result?.totals[me.id] ?? 0);
  }, [state, me]);

  if (error) {
    return (
      <div className="shell grid min-h-[100svh] place-items-center">
        <Card className="max-w-sm space-y-4 p-6 text-center">
          <div className="text-4xl">🫥</div>
          <p className="font-semibold">{error}</p>
          <Button full onClick={() => router.push("/play")}>
            Zurück
          </Button>
        </Card>
      </div>
    );
  }

  if (!state || !profile) {
    return (
      <div className="grid min-h-[100svh] place-items-center">
        <div className="animate-pulse">
          <Mark size={64} />
        </div>
      </div>
    );
  }

  const { settings, players, round, review, result, phase } = state;
  const roundLabel = `Runde ${round?.no ?? state.roundNo}/${settings.rounds}`;

  // ------------------------------------------------------------------- lobby

  if (phase === "lobby") {
    return (
      <div className="shell space-y-5 py-[calc(1.5rem+var(--safe-t))] pb-[calc(2rem+var(--safe-b))]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={async () => {
              await call({ type: "leave" });
              router.push("/play");
            }}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/8 text-lg"
            aria-label="Raum verlassen"
          >
            ←
          </button>
          <h1 className="text-2xl font-extrabold">Lobby</h1>
        </div>

        <Card className="space-y-3 p-5 text-center">
          <div className="text-xs font-bold tracking-wide text-muted uppercase">Raum-Code</div>
          <div className="text-[clamp(2.75rem,16vw,4.5rem)] leading-none font-extrabold tracking-[0.18em] text-lime">
            {code}
          </div>
          <Button variant="secondary" full onClick={share}>
            {copied ? "Link kopiert ✓" : "Freunde einladen"}
          </Button>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h2 className="text-sm font-bold tracking-wide text-muted uppercase">
              Spieler ({players.length})
            </h2>
            {isHost ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => call({ type: "removeBot" })}
                  disabled={!players.some((p) => p.kind === "bot")}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold disabled:opacity-30"
                >
                  − Bot
                </button>
                <button
                  type="button"
                  onClick={() => call({ type: "addBot" })}
                  disabled={players.length >= 10}
                  className="rounded-full bg-lime/20 px-3 py-1 text-xs font-bold text-lime disabled:opacity-30"
                >
                  + Bot
                </button>
              </div>
            ) : null}
          </div>
          <ul className="divide-y divide-white/5">
            {players.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-xl">{p.emoji}</span>
                <span className="min-w-0 flex-1 truncate font-semibold">
                  {p.name}
                  {p.id === profile.id ? " (du)" : ""}
                </span>
                {p.isHost ? <Chip tone="lime">Host</Chip> : null}
                {p.kind === "bot" ? <Chip tone="cyan">Bot</Chip> : null}
                {p.kind === "human" && !p.connected ? <Chip>offline</Chip> : null}
                {isHost && p.id !== profile.id && p.kind === "human" ? (
                  <button
                    type="button"
                    onClick={() => call({ type: "kick", playerId: p.id })}
                    className="text-xs font-semibold text-muted hover:text-magenta"
                  >
                    kick
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>

        <CategoryEditor
          categories={settings.categories}
          disabled={!isHost}
          learning={learning}
          onChange={(categories) => call({ type: "settings", settings: { ...settings, categories } })}
        />

        <SettingsPanel
          settings={settings}
          disabled={!isHost}
          showDifficulty={players.some((p) => p.kind === "bot")}
          onChange={(next: GameSettings) => call({ type: "settings", settings: next })}
        />

        {isHost ? (
          <Button full size="lg" onClick={() => call({ type: "start" })} disabled={players.length < 2}>
            {players.length < 2 ? "Warte auf Mitspieler…" : "Spiel starten 🎲"}
          </Button>
        ) : (
          <div className="rounded-2xl bg-white/8 py-4 text-center text-sm font-semibold text-muted">
            Warte auf den Host…
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------------------- playing

  if (phase === "playing" && round) {
    const untilStart = round.startedAt - serverNow();
    if (untilStart > 200) {
      return (
        <div className="shell grid min-h-[100svh] place-items-center">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="text-sm font-semibold text-muted">{roundLabel}</div>
            <LetterDice letter={round.letter} excluded={settings.excludedLetters} rollMs={2200} />
            <div className="text-lg font-bold">Buchstabe wird gewürfelt…</div>
          </div>
        </div>
      );
    }

    const stopper = round.stoppedBy ? players.find((p) => p.id === round.stoppedBy) ?? null : null;
    const msLeft = round.deadline === null ? null : round.deadline - serverNow();

    return (
      <AnswerSheet
        categories={settings.categories}
        letter={round.letter}
        answers={answers}
        onChange={(id, value) => setAnswers((a) => ({ ...a, [id]: value }))}
        onSubmit={submit}
        locked={submitted.current || round.locked.includes(profile.id)}
        allowStop={settings.allowStop}
        msLeft={msLeft}
        totalMs={settings.roundSeconds > 0 ? settings.roundSeconds * 1000 : null}
        players={players}
        progress={round.progress}
        stoppedBy={stopper && stopper.id !== profile.id ? stopper : null}
        roundLabel={roundLabel}
      />
    );
  }

  // ------------------------------------------------------------------ voting

  if (phase === "voting" && round && review) {
    const secondsLeft = Math.max(0, Math.ceil((review.endsAt - serverNow()) / 1000));
    return (
      <ReviewSheet
        categories={settings.categories}
        letter={round.letter}
        players={players}
        answers={review.answers}
        vetoes={review.vetoes}
        myId={profile.id}
        confirmed={review.confirmed}
        secondsLeft={secondsLeft}
        roundLabel={roundLabel}
        onVeto={(target, on) => call({ type: "veto", target, on })}
        onConfirm={() => call({ type: "confirmVote" })}
      />
    );
  }

  // ----------------------------------------------------------------- results

  if (phase === "results" && result) {
    return (
      <ResultsSheet
        categories={settings.categories}
        players={players}
        result={result}
        roundLabel={roundLabel}
        canAdvance={isHost}
        nextLabel="Nächste Runde 🎲"
        onNext={() => call({ type: "next" })}
        waitingFor="Der Host startet die nächste Runde…"
      />
    );
  }

  if (phase === "final") {
    return (
      <FinalSheet
        players={players}
        myId={profile.id}
        canRematch={isHost}
        onRematch={() => {
          recorded.current = false;
          void call({ type: "restart" });
        }}
        extra={
          <Card className="p-4 text-center text-sm text-muted">
            Raum <span className="font-bold text-paper">{code}</span> bleibt offen — der Host kann
            eine Revanche starten.
          </Card>
        }
      />
    );
  }

  return (
    <div className="shell grid min-h-[100svh] place-items-center text-center">
      <div className="space-y-3">
        <div className="animate-pulse">
          <Mark size={56} />
        </div>
        <p className="text-sm text-muted">Synchronisiere…</p>
        <Link href="/" className="text-xs text-muted underline">
          Abbrechen
        </Link>
      </div>
    </div>
  );
}
