"use client";

import { useEffect } from "react";
import { useCelebrate } from "@/components/CelebrationProvider";
import type { DayProgress } from "@/lib/queue";

const fill = { new: "bg-sun-mark", review: "bg-sky-mark" } as const;
// empty tracks get a faint ring so they read on a white card too
const empty = {
  new: "bg-sun-soft ring-1 ring-inset ring-sun-mark/35",
  review: "bg-sky-soft ring-1 ring-inset ring-sky-mark/35",
} as const;

// Today's plan as chunky segments: sun for new problems, sky for reviews,
// filled as each is done. The "2 of 3 done" text carries the meaning; the
// colours are the shape. Finishing the plan throws one party per day.
export default function DayProgressBar({ progress, today }: { progress: DayProgress; today: string }) {
  const celebrate = useCelebrate();
  const { done, total, extra, segments } = progress;
  const complete = total > 0 && done >= total;

  useEffect(() => {
    if (!complete) return;
    const key = `celebrated-day:${today}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    celebrate({ tone: "day", title: "That's the day done!", body: "Plan complete. Anything else is a bonus." });
  }, [complete, today, celebrate]);

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="text-sm font-bold">
          {complete ? (
            <span className="text-mint-ink">✓ Today&apos;s plan is done</span>
          ) : (
            <>
              Today&apos;s plan <span className="data ml-1 font-normal text-muted">{done}/{total}</span>
            </>
          )}
        </p>
        {extra > 0 && <span className="chip bg-grape-soft text-grape-ink">+{extra} bonus</span>}
      </div>
      <div
        role="progressbar"
        aria-label="Today's plan"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-valuetext={`${done} of ${total} done`}
        className="flex gap-1.5"
      >
        {segments.map((s, i) => (
          <div
            key={i}
            title={`${s.kind === "new" ? "New problem" : "Review"}${s.done ? " · done" : ""}`}
            className={`h-3 flex-1 rounded-full transition-colors duration-250 ease-strong ${
              s.done ? fill[s.kind] : empty[s.kind]
            }`}
          />
        ))}
      </div>
    </div>
  );
}
