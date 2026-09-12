"use client";

import { useEffect, useRef, useState } from "react";
import { diceFrames } from "@/lib/game/letters";

/**
 * The letter die. Tumbles through random letters, then lands hard on the one
 * the round is actually played with.
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
  const [shown, setShown] = useState(letter);
  const [rolling, setRolling] = useState(false);
  const landed = useRef(letter);

  useEffect(() => {
    if (landed.current === letter) return;
    landed.current = letter;
    const frames = diceFrames(letter, excluded, Math.max(8, Math.round(rollMs / 95)));
    setRolling(true);
    let i = 0;
    const step = rollMs / frames.length;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const frame of frames) {
      const at = step * i++;
      timers.push(setTimeout(() => setShown(frame), at));
    }
    timers.push(
      setTimeout(() => {
        setRolling(false);
        onLanded?.();
      }, rollMs),
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letter]);

  const box =
    size === "lg"
      ? "h-[clamp(6rem,26vw,9rem)] w-[clamp(6rem,26vw,9rem)] text-[clamp(3.5rem,16vw,5.5rem)] rounded-[1.75rem]"
      : "h-16 w-16 text-4xl rounded-2xl";

  return (
    <div className="relative grid place-items-center" style={{ perspective: "600px" }}>
      <div
        className={`absolute inset-0 -z-10 blur-2xl transition-opacity duration-500 ${rolling ? "opacity-70" : "opacity-40"}`}
        style={{ background: "radial-gradient(circle, rgba(184,255,74,0.5), transparent 65%)" }}
      />
      <div
        className={`grid place-items-center bg-gradient-to-br from-lime to-cyan font-extrabold text-ink shadow-2xl ${box} ${
          rolling ? "animate-tumble" : "animate-land"
        }`}
        style={{ transformStyle: "preserve-3d" }}
      >
        <span className="translate-y-[-0.04em] tabular-nums">{shown}</span>
      </div>
    </div>
  );
}
