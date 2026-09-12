"use client";

import { useEffect, useRef, useState } from "react";
import { diceFrames } from "@/lib/game/letters";

type Frame = { letter: string; rot: number; tilt: number; scale: number; gap: number };

/** Sparks that fly out of the die when it lands. */
const SPARKS = [0, 45, 90, 135, 180, 225, 270, 315];

/**
 * The letter die.
 *
 * Flickers through random letters, decelerating like a real die losing energy,
 * then lands hard: squash-and-stretch, a shockwave ring and a spark burst.
 * Frame gaps are eased, so the slowdown does the work rather than a fixed
 * animation - the die feels heavier the longer it rolls.
 */
export function LetterDice({
  letter,
  excluded,
  rollMs = 1700,
  onLanded,
  size = "lg",
}: {
  letter: string;
  excluded?: string[];
  rollMs?: number;
  onLanded?: () => void;
  size?: "sm" | "lg";
}) {
  const [frame, setFrame] = useState<Frame>({ letter, rot: 0, tilt: 0, scale: 1, gap: 0 });
  const [stage, setStage] = useState<"idle" | "rolling" | "landed">("idle");
  const settled = useRef(letter);

  useEffect(() => {
    if (settled.current === letter) return;
    settled.current = letter;

    const steps = 22;
    const letters = diceFrames(letter, excluded, steps);
    // Ease-in gaps: a fast blur at the start, heavy clunks at the end.
    const at = (i: number) => {
      const x = i / steps;
      return rollMs * (0.15 * x + 0.85 * Math.pow(x, 2.6));
    };

    const timers: ReturnType<typeof setTimeout>[] = [];
    setStage("rolling");

    for (let i = 0; i < letters.length; i++) {
      const start = at(i);
      const gap = Math.max(24, at(i + 1) - start);
      const last = i === letters.length - 1;
      timers.push(
        setTimeout(() => {
          setFrame({
            letter: letters[i],
            rot: last ? 0 : (Math.random() - 0.5) * 34,
            tilt: last ? 0 : (Math.random() - 0.5) * 60,
            scale: last ? 1 : 0.9 + Math.random() * 0.28,
            gap,
          });
        }, start),
      );
    }

    timers.push(
      setTimeout(() => {
        setStage("landed");
        navigator.vibrate?.(35);
      }, rollMs),
    );
    timers.push(setTimeout(() => onLanded?.(), rollMs + 420));

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letter]);

  const rolling = stage === "rolling";
  const box =
    size === "lg"
      ? "h-[clamp(6rem,26vw,9rem)] w-[clamp(6rem,26vw,9rem)] text-[clamp(3.5rem,16vw,5.5rem)] rounded-[1.75rem]"
      : "h-16 w-16 text-4xl rounded-2xl";

  return (
    <div className="relative grid place-items-center" style={{ perspective: "700px" }}>
      {/* Glow behind the die, brightest while it is still spinning. */}
      <div
        className={`pointer-events-none absolute inset-[-30%] -z-10 rounded-full blur-2xl transition-opacity duration-300 ${
          rolling ? "animate-dice-glow" : "opacity-45"
        }`}
        style={{ background: "radial-gradient(circle, rgba(184,255,74,0.55), transparent 66%)" }}
      />

      {/* Shockwave on impact. */}
      {stage === "landed" ? (
        <span
          key={`ring-${letter}`}
          aria-hidden
          className="animate-dice-ring pointer-events-none absolute inset-0 rounded-[2rem] border-2 border-lime"
        />
      ) : null}

      {/* Spark burst on impact. */}
      {stage === "landed"
        ? SPARKS.map((deg) => (
            <span
              key={`spark-${letter}-${deg}`}
              aria-hidden
              className="animate-dice-spark pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-lime"
              style={
                {
                  "--tx": `${Math.cos((deg * Math.PI) / 180) * 5.5}rem`,
                  "--ty": `${Math.sin((deg * Math.PI) / 180) * 5.5}rem`,
                } as React.CSSProperties
              }
            />
          ))
        : null}

      <div
        className={`grid place-items-center bg-gradient-to-br from-lime to-cyan font-extrabold text-ink shadow-2xl ${box} ${
          stage === "landed" ? "animate-dice-land" : ""
        }`}
        style={{
          transform: rolling
            ? `rotateX(${frame.tilt}deg) rotateZ(${frame.rot}deg) scale(${frame.scale})`
            : undefined,
          transition: rolling ? `transform ${frame.gap}ms linear` : undefined,
          filter: rolling && frame.gap < 70 ? "blur(0.6px)" : undefined,
        }}
      >
        <span className="translate-y-[-0.04em] tabular-nums">{frame.letter}</span>
      </div>
    </div>
  );
}
