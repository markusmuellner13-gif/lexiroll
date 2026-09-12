"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const DISMISSED = "wj-install-dismissed";

/**
 * Android/Chrome get the real install prompt; iOS gets the only thing Safari
 * allows - a short "Teilen -> Zum Home-Bildschirm" hint.
 */
export function InstallPrompt() {
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

    const ua = navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
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

  return (
    <div className="glass flex items-center gap-3 rounded-2xl p-3 text-sm">
      <span className="text-xl">📲</span>
      <div className="min-w-0 flex-1">
        {iosHint ? (
          <span className="text-muted">
            Tippe auf <strong className="text-paper">Teilen</strong> und dann{" "}
            <strong className="text-paper">Zum Home-Bildschirm</strong> — dann startet Wortjagd wie
            eine echte App.
          </span>
        ) : (
          <span className="text-muted">Wortjagd auf dem Homescreen installieren?</span>
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
          Installieren
        </Button>
      ) : null}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Hinweis ausblenden"
        className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-muted"
      >
        ×
      </button>
    </div>
  );
}
