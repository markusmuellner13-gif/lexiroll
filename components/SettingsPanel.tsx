"use client";

import type { GameSettings } from "@/lib/game/types";
import { HARD_LETTERS } from "@/lib/game/letters";
import { Card, SegmentedControl, Stepper, Toggle } from "./ui";

export function SettingsPanel({
  settings,
  onChange,
  disabled,
  showDifficulty = true,
}: {
  settings: GameSettings;
  onChange: (next: GameSettings) => void;
  disabled?: boolean;
  showDifficulty?: boolean;
}) {
  const patch = (p: Partial<GameSettings>) => onChange({ ...settings, ...p });

  if (disabled) {
    return (
      <Card className="flex flex-wrap gap-2 p-4 text-sm text-muted">
        <span>{settings.rounds} Runden</span>
        <span>·</span>
        <span>{settings.roundSeconds === 0 ? "ohne Zeitlimit" : `${settings.roundSeconds}s pro Runde`}</span>
        <span>·</span>
        <span>{settings.allowStop ? "Stopp erlaubt" : "kein Stopp"}</span>
      </Card>
    );
  }

  return (
    <Card className="space-y-4 p-4">
      <h3 className="text-sm font-bold tracking-wide text-muted uppercase">Spielregeln</h3>

      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold">Runden</span>
        <Stepper value={settings.rounds} min={1} max={20} onChange={(rounds) => patch({ rounds })} />
      </div>

      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold">Zeit pro Runde</span>
        <Stepper
          value={settings.roundSeconds}
          min={0}
          max={300}
          step={15}
          onChange={(roundSeconds) => patch({ roundSeconds })}
          format={(v) => (v === 0 ? "∞" : `${v}s`)}
        />
      </div>

      {showDifficulty ? (
        <div className="space-y-2">
          <span className="text-sm font-semibold">Bot-Stärke</span>
          <SegmentedControl
            value={settings.botDifficulty}
            onChange={(botDifficulty) => patch({ botDifficulty })}
            options={[
              { value: "chill", label: "Chillig" },
              { value: "normal", label: "Normal" },
              { value: "brutal", label: "Brutal" },
            ]}
          />
        </div>
      ) : null}

      <div className="space-y-1 border-t border-white/8 pt-2">
        <Toggle
          checked={settings.allowStop}
          onChange={(allowStop) => patch({ allowStop })}
          label="Stopp-Knopf"
          hint="Wer zuerst alles ausfüllt, beendet die Runde für alle."
        />
        <Toggle
          checked={settings.soloBonus}
          onChange={(soloBonus) => patch({ soloBonus })}
          label="20 Punkte für Einzelkämpfer"
          hint="Als Einzige(r) mit einer Antwort gibt es doppelt."
        />
        <Toggle
          checked={HARD_LETTERS.every((l) => settings.excludedLetters.includes(l))}
          onChange={(on) => patch({ excludedLetters: on ? [...HARD_LETTERS] : [] })}
          label="Fiese Buchstaben raus"
          hint={`Ohne ${HARD_LETTERS.join(", ")}.`}
        />
      </div>
    </Card>
  );
}
