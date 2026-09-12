"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { answersAt, makeBots, planBotRound, type BotPlan } from "@/lib/game/bots";
import { rollLetter } from "@/lib/game/letters";
import { scoreRound, type VetoMap } from "@/lib/game/scoring";
import type { Answers, GameSettings, Player, RoundResult } from "@/lib/game/types";
import { hydrateCachedBanks, useBotTraining } from "@/lib/botbanks";
import { loadProfile, loadSettings, recordGame, saveSettings } from "@/lib/storage";
import { AnswerSheet } from "./AnswerSheet";
import { CategoryEditor } from "./CategoryEditor";
import { FinalSheet } from "./FinalSheet";
import { LetterDice } from "./LetterDice";
import { ResultsSheet } from "./ResultsSheet";
import { ReviewSheet } from "./ReviewSheet";
import { SettingsPanel } from "./SettingsPanel";
import { Button, Card, Stepper } from "./ui";
import { Mark } from "./Logo";

const ME = "me";
const STOP_GRACE_MS = 3000;

type Phase = "setup" | "rolling" | "playing" | "review" | "results" | "final";

export function SoloGame() {
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [botCount, setBotCount] = useState(2);
  const [phase, setPhase] = useState<Phase>("setup");
  const [players, setPlayers] = useState<Player[]>([]);
  const [roundNo, setRoundNo] = useState(0);
  const [usedLetters, setUsedLetters] = useState<string[]>([]);
  const [letter, setLetter] = useState("A");
  const [answers, setAnswers] = useState<Answers>({});
  const [plans, setPlans] = useState<BotPlan[]>([]);
  const [roundStart, setRoundStart] = useState(0);
  const [stoppedAt, setStoppedAt] = useState<number | null>(null);
  const [stoppedBy, setStoppedBy] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [frozen, setFrozen] = useState<Record<string, Answers> | null>(null);
  const [vetoes, setVetoes] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<RoundResult | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    hydrateCachedBanks();
    setSettings(loadSettings());
  }, []);

  const learning = useBotTraining(settings?.categories ?? [], (updates) => {
    setSettings((s) => {
      if (!s) return s;
      const map = new Map(updates.map((u) => [u.id, u.bank]));
      return { ...s, categories: s.categories.map((c) => (map.has(c.id) ? { ...c, bank: map.get(c.id)! } : c)) };
    });
  });

  // One clock for the whole screen.
  useEffect(() => {
    if (phase !== "playing" && phase !== "review") return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [phase]);

  const patchSettings = (next: GameSettings) => {
    setSettings(next);
    saveSettings(next);
  };

  const categories = settings?.categories ?? [];

  const startRound = useCallback(
    (currentPlayers: Player[], currentSettings: GameSettings, used: string[], nextRound: number) => {
      const next = rollLetter(used, currentSettings.excludedLetters);
      setLetter(next);
      setUsedLetters([...used, next]);
      setRoundNo(nextRound);
      setAnswers({});
      setVetoes({});
      setResult(null);
      setFrozen(null);
      setStoppedAt(null);
      setStoppedBy(null);
      setLocked(false);
      setPlans(
        currentPlayers
          .filter((p) => p.kind === "bot")
          .map((bot) => planBotRound(bot, currentSettings.categories, next, currentSettings)),
      );
      setPhase("rolling");
    },
    [],
  );

  const begin = () => {
    if (!settings) return;
    const bots = makeBots(botCount, settings.botDifficulty);
    const me = loadProfile();
    const roster: Player[] = [
      { id: ME, name: me.name.trim() || "Du", emoji: me.emoji, kind: "human", score: 0, isHost: true },
      ...bots,
    ];
    setPlayers(roster);
    startRound(roster, settings, [], 1);
  };

  const elapsed = Math.max(0, now - roundStart);
  const deadline = useMemo(() => {
    if (!settings || !roundStart) return null;
    const hard = settings.roundSeconds > 0 ? roundStart + settings.roundSeconds * 1000 : null;
    const grace = stoppedAt ? stoppedAt + STOP_GRACE_MS : null;
    if (hard && grace) return Math.min(hard, grace);
    return grace ?? hard;
  }, [settings, roundStart, stoppedAt]);

  /** Freezes everything and moves to the review phase. */
  const closeRound = useCallback(
    (botCutoffMs: number) => {
      const collected: Record<string, Answers> = { [ME]: { ...answersRef.current } };
      for (const plan of plans) collected[plan.playerId] = answersAt(plan, botCutoffMs);
      setFrozen(collected);
      setPhase("review");
    },
    [plans],
  );

  // `answers` changes every keystroke; keep a ref so closeRound stays stable.
  const answersRef = useRef<Answers>({});
  answersRef.current = answers;

  // Bots reaching their Stopp moment, and the round clock running out.
  useEffect(() => {
    if (phase !== "playing" || !settings) return;

    if (!stoppedAt && settings.allowStop) {
      const stopper = plans
        .filter((p) => p.stopAtMs !== null && p.stopAtMs <= elapsed)
        .sort((a, b) => (a.stopAtMs ?? 0) - (b.stopAtMs ?? 0))[0];
      if (stopper) {
        setStoppedAt(roundStart + (stopper.stopAtMs ?? 0));
        setStoppedBy(stopper.playerId);
        return;
      }
    }

    if (deadline !== null && now >= deadline) {
      closeRound(stoppedAt ? stoppedAt - roundStart : deadline - roundStart);
      return;
    }

    // Nobody left to wait for: I am locked in and every bot has finished.
    if (locked && plans.every((p) => p.doneAtMs <= elapsed)) closeRound(elapsed);
  }, [phase, now, elapsed, deadline, plans, settings, stoppedAt, roundStart, closeRound, locked]);

  const submit = (stop: boolean) => {
    setLocked(true);
    if (!stop) return; // just handing in early - the bots keep writing
    setStoppedAt(Date.now());
    setStoppedBy(ME);
    closeRound(elapsed);
  };

  const finishReview = () => {
    if (!settings || !frozen) return;
    const vetoMap: VetoMap = {};
    for (const [target, voters] of Object.entries(vetoes)) if (voters.length) vetoMap[target] = true;
    const scored = scoreRound(
      letter,
      settings.categories,
      players.map((p) => p.id),
      frozen,
      settings,
      vetoMap,
    );
    setResult(scored);
    const updated = players.map((p) => ({ ...p, score: p.score + (scored.totals[p.id] ?? 0) }));
    setPlayers(updated);
    const isFinal = roundNo >= settings.rounds;
    setPhase(isFinal ? "final" : "results");
    if (isFinal) {
      const mine = updated.find((p) => p.id === ME);
      const best = Math.max(...updated.map((p) => p.score));
      recordGame(mine ? mine.score === best : false, mine?.score ?? 0, scored.totals[ME] ?? 0);
    }
  };

  if (!settings) {
    return (
      <div className="grid min-h-[100svh] place-items-center">
        <Mark size={64} />
      </div>
    );
  }

  // ------------------------------------------------------------------ screens

  if (phase === "setup") {
    return (
      <div className="shell space-y-5 py-[calc(1.5rem+var(--safe-t))] pb-[calc(2rem+var(--safe-b))]">
        <div className="flex items-center gap-3">
          <Link href="/" className="grid h-10 w-10 place-items-center rounded-full bg-white/8 text-lg">
            ←
          </Link>
          <h1 className="text-2xl font-extrabold">Solo gegen Bots</h1>
        </div>

        <Card className="flex items-center justify-between gap-4 p-4">
          <div>
            <div className="text-sm font-bold">Gegner</div>
            <div className="text-xs text-muted">So viele Bots spielen mit.</div>
          </div>
          <Stepper value={botCount} min={1} max={5} onChange={setBotCount} />
        </Card>

        <CategoryEditor
          categories={categories}
          onChange={(next) => patchSettings({ ...settings, categories: next })}
          learning={learning}
        />

        <SettingsPanel settings={settings} onChange={patchSettings} />

        <Button full size="lg" onClick={begin}>
          Los geht&apos;s 🎲
        </Button>
      </div>
    );
  }

  if (phase === "rolling") {
    return (
      <div className="shell grid min-h-[100svh] place-items-center">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="text-sm font-semibold text-muted">
            Runde {roundNo} von {settings.rounds}
          </div>
          <LetterDice
            letter={letter}
            excluded={settings.excludedLetters}
            onLanded={() => {
              const start = Date.now();
              setRoundStart(start);
              setNow(start);
              setPhase("playing");
            }}
          />
          <div className="text-lg font-bold">Buchstabe wird gewürfelt…</div>
        </div>
      </div>
    );
  }

  if (phase === "playing") {
    const progress: Record<string, number> = {
      [ME]: Object.values(answers).filter((v) => v.trim()).length,
    };
    for (const plan of plans) {
      progress[plan.playerId] = plan.fills.filter((f) => f.atMs <= elapsed).length;
    }
    const stopper = stoppedBy && stoppedBy !== ME ? players.find((p) => p.id === stoppedBy) ?? null : null;

    return (
      <AnswerSheet
        categories={categories}
        letter={letter}
        answers={answers}
        onChange={(id, value) => setAnswers((a) => ({ ...a, [id]: value }))}
        onSubmit={submit}
        locked={locked}
        allowStop={settings.allowStop}
        msLeft={deadline === null ? null : deadline - now}
        totalMs={settings.roundSeconds > 0 ? settings.roundSeconds * 1000 : null}
        players={players}
        progress={progress}
        stoppedBy={stopper}
        roundLabel={`Runde ${roundNo}/${settings.rounds}`}
      />
    );
  }

  if (phase === "review" && frozen) {
    return (
      <ReviewSheet
        categories={categories}
        letter={letter}
        players={players}
        answers={frozen}
        vetoes={vetoes}
        myId={ME}
        onVeto={(target, on) =>
          setVetoes((v) => {
            const next = { ...v };
            if (on) next[target] = [ME];
            else delete next[target];
            return next;
          })
        }
        onConfirm={finishReview}
        confirmed={[]}
        secondsLeft={null}
        roundLabel={`Runde ${roundNo}/${settings.rounds}`}
      />
    );
  }

  if (phase === "results" && result) {
    return (
      <ResultsSheet
        categories={categories}
        players={players}
        result={result}
        roundLabel={`Runde ${roundNo}/${settings.rounds}`}
        canAdvance
        nextLabel="Nächste Runde 🎲"
        onNext={() => startRound(players, settings, usedLetters, roundNo + 1)}
      />
    );
  }

  if (phase === "final") {
    return (
      <FinalSheet
        players={players}
        myId={ME}
        canRematch
        onRematch={() => {
          const reset = players.map((p) => ({ ...p, score: 0 }));
          setPlayers(reset);
          startRound(reset, settings, [], 1);
        }}
        extra={
          result ? (
            <Card className="p-4 text-center text-sm text-muted">
              Letzter Buchstabe: <span className="font-bold text-paper">{result.letter}</span> ·{" "}
              {settings.rounds} Runden · {categories.length} Kategorien
            </Card>
          ) : null
        }
      />
    );
  }

  return null;
}


