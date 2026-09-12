"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n/provider";
import { Mark } from "./Logo";

/**
 * Painted in the server HTML, so it is on screen before React boots. It fades
 * itself out once hydration is done - and only shows at all on a cold start,
 * never on client-side navigation.
 */
export function BootScreen() {
  const { t } = useLang();
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("lx-booted")) {
      setGone(true);
      return;
    }
    sessionStorage.setItem("lx-booted", "1");
    const a = setTimeout(() => setLeaving(true), 520);
    const b = setTimeout(() => setGone(true), 1000);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] grid place-items-center bg-ink transition-opacity duration-500 ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      style={{
        backgroundImage:
          "radial-gradient(40rem 40rem at 50% 30%, rgba(184,255,74,0.14), transparent 60%), radial-gradient(30rem 30rem at 50% 90%, rgba(255,79,163,0.14), transparent 60%)",
      }}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center gap-6">
        <div className="animate-land">
          <Mark size={112} />
        </div>
        <div className="text-center">
          <div className="text-3xl font-extrabold tracking-tight">
            Lexi<span className="text-lime">roll</span>
          </div>
          <div className="mt-1 text-sm text-muted">{t.tagline}</div>
        </div>
        <div className="mt-2 h-1 w-32 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/3 animate-loader rounded-full bg-lime" />
        </div>
      </div>
    </div>
  );
}
