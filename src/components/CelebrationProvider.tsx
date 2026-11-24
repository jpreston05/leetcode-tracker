"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { fireConfetti } from "@/lib/confetti";

export type CelebrationTone = "day" | "retire" | "milestone";

export interface Celebration {
  tone: CelebrationTone;
  title: string;
  body?: string;
}

const CelebrateContext = createContext<(c: Celebration) => void>(() => {});

/** Trigger a celebration from any client component. */
export function useCelebrate() {
  return useContext(CelebrateContext);
}

type ToastTone = Exclude<CelebrationTone, "milestone">;

const toneStyles: Record<ToastTone, { card: string; badge: string; emoji: string }> = {
  day: { card: "border-brand/40", badge: "bg-brand text-on-fill", emoji: "🎉" },
  retire: { card: "border-grape/50", badge: "bg-grape text-on-fill", emoji: "🎓" },
};

/**
 * Lives in the root layout so a celebration survives the router.refresh()
 * that follows every logged attempt. Toasts for the day/retirements; a
 * dialog card for milestones. Confetti is skipped under reduced motion.
 */
export default function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<(Celebration & { tone: ToastTone; id: number }) | null>(null);
  const [milestone, setMilestone] = useState<Celebration | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const celebrate = useCallback((c: Celebration) => {
    if (c.tone === "milestone") {
      setMilestone(c);
      void fireConfetti("big");
    } else {
      setToast({ ...c, tone: c.tone, id: Date.now() });
      void fireConfetti(c.tone === "retire" ? "big" : "small");
    }
  }, []);

  // auto-dismiss toasts; a new toast restarts the timer
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (milestone) dialogRef.current?.showModal();
  }, [milestone]);

  const style = toast ? toneStyles[toast.tone] : null;

  return (
    <CelebrateContext.Provider value={celebrate}>
      {children}

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        {toast && style && (
          <div
            key={toast.id}
            className={`card animate-toast-in pointer-events-auto flex max-w-sm items-start gap-3 border-2 px-4 py-3 shadow-lift ${
              style.card
            }`}
          >
            <span
              aria-hidden
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg ${
                style.badge
              } ${toast.tone === "retire" ? "animate-stamp" : ""}`}
            >
              {style.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-ink">{toast.title}</p>
              {toast.body && <p className="mt-0.5 text-sm text-muted">{toast.body}</p>}
            </div>
            <button
              onClick={() => setToast(null)}
              aria-label="Dismiss"
              className="-mr-1 rounded-full px-2 text-faint hover:bg-raised hover:text-ink"
            >
              ×
            </button>
          </div>
        )}
      </div>

      <dialog
        ref={dialogRef}
        onClose={() => setMilestone(null)}
        className="m-auto w-[min(26rem,calc(100%-2rem))] rounded-3xl border-2 border-grape/50 bg-surface p-0 text-ink shadow-lift backdrop:bg-on-fill/50 backdrop:backdrop-blur-[2px] open:animate-toast-in"
      >
        {milestone && (
          <div className="flex flex-col items-center px-8 pt-10 pb-8 text-center">
            <div aria-hidden className="mb-5 flex items-end gap-1.5">
              <span className="h-6 w-6 rounded-full bg-sun" />
              <span className="h-10 w-10 rounded-full bg-sky" />
              <span className="h-14 w-14 animate-stamp rounded-2xl bg-grape" />
              <span className="h-10 w-10 rounded-full bg-mint" />
              <span className="h-6 w-6 rounded-full bg-coral" />
            </div>
            <p className="chip mb-3 bg-grape-soft text-grape-ink">Milestone</p>
            <h2 className="text-2xl font-extrabold tracking-tight">{milestone.title}</h2>
            {milestone.body && <p className="mt-2 text-muted">{milestone.body}</p>}
            <button autoFocus onClick={() => dialogRef.current?.close()} className="btn-primary mt-7 px-6">
              Keep going
            </button>
          </div>
        )}
      </dialog>
    </CelebrateContext.Provider>
  );
}
