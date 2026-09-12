"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n/provider";
import { Button } from "./ui";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const DISMISSED = "lx-install-dismissed";

/**
 * Android/Chrome get the real install prompt; iOS gets the only thing Safari
 * allows - a short "Share -> Add to Home Screen" hint.
 */
export function InstallPrompt() {
  const { t } = useLang();
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED)) return;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallEvent);
      setHidden(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
    if (isIos) {
      setIosHint(true);
      setHidden(false);
    }
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (hidden) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISSED, "1");
    setHidden(true);
  };

  const [lead, share, then, add, tail] = t.install.iosHint;

  return (
    <div className="glass flex items-center gap-3 rounded-2xl p-3 text-sm">
      <span className="text-xl">📲</span>
      <div className="min-w-0 flex-1">
        {iosHint ? (
          <span className="text-muted">
            {lead} <strong className="text-paper">{share}</strong> {then}{" "}
            <strong className="text-paper">{add}</strong> {tail}
          </span>
        ) : (
          <span className="text-muted">{t.install.question}</span>
        )}
      </div>
      {deferred ? (
        <Button
          size="sm"
          onClick={async () => {
            await deferred.prompt();
            await deferred.userChoice.catch(() => null);
            dismiss();
          }}
        >
          {t.install.install}
        </Button>
      ) : null}
      <button
        type="button"
        onClick={dismiss}
        aria-label={t.install.dismiss}
        className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-muted"
      >
        ×
      </button>
    </div>
  );
}
