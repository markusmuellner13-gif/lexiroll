"use client";

import type { GameSettings } from "@/lib/game/types";
import { hardLetters } from "@/lib/game/letters";
import { useLang } from "@/lib/i18n/provider";
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
  const { t } = useLang();
  const patch = (p: Partial<GameSettings>) => onChange({ ...settings, ...p });
  const hard = hardLetters(settings.lang);
  const noTimer = settings.roundSeconds === 0;

  if (disabled) {
    return (
      <Card className="flex flex-wrap gap-2 p-4 text-sm text-muted">
        <span>{t.settings.summaryRounds(settings.rounds)}</span>
        <span>·</span>
        <span>{noTimer ? t.settings.summaryNoTime : t.settings.summaryTime(settings.roundSeconds)}</span>
        <span>·</span>
        <span>{settings.allowStop ? t.settings.summaryStop : t.settings.summaryNoStop}</span>
      </Card>
    );
  }

  return (
    <Card className="space-y-4 p-4">
      <h3 className="text-sm font-bold tracking-wide text-muted uppercase">{t.settings.title}</h3>

      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold">{t.settings.rounds}</span>
        <Stepper value={settings.rounds} min={1} max={20} onChange={(rounds) => patch({ rounds })} />
      </div>

      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold">{t.settings.timePerRound}</span>
        <Stepper
          value={settings.roundSeconds}
          min={0}
          max={300}
          step={15}
          onChange={(roundSeconds) =>
            // Without a clock, Stop is the only thing that can end a round.
            patch(roundSeconds === 0 ? { roundSeconds, allowStop: true } : { roundSeconds })
          }
          format={(v) => (v === 0 ? "∞" : `${v}s`)}
        />
      </div>

      {showDifficulty ? (
        <div className="space-y-2">
          <span className="text-sm font-semibold">{t.settings.botStrength}</span>
          <SegmentedControl
            value={settings.botDifficulty}
            onChange={(botDifficulty) => patch({ botDifficulty })}
            options={[
              { value: "chill", label: t.settings.chill },
              { value: "normal", label: t.settings.normal },
              { value: "brutal", label: t.settings.brutal },
            ]}
          />
        </div>
      ) : null}

      <div className="space-y-1 border-t border-white/8 pt-2">
        <Toggle
          checked={settings.allowStop}
          onChange={(allowStop) => {
            if (noTimer) return; // nothing else would end the round
            patch({ allowStop });
          }}
          label={t.settings.stopButton}
          hint={noTimer ? t.settings.stopHintForced : t.settings.stopHint}
        />
        <Toggle
          checked={settings.soloBonus}
          onChange={(soloBonus) => patch({ soloBonus })}
          label={t.settings.soloBonus}
          hint={t.settings.soloBonusHint}
        />
        <Toggle
          checked={hard.every((l) => settings.excludedLetters.includes(l))}
          onChange={(on) => patch({ excludedLetters: on ? [...hard] : [] })}
          label={t.settings.hardLetters}
          hint={t.settings.hardLettersHint(hard.join(", "))}
        />
      </div>
    </Card>
  );
}
