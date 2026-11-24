import type { DayProgress } from "@/lib/queue";

// Today's plan as a segmented bar: one segment per task, done ones filled in
// the accent. The "2 of 3 done" text carries the meaning; the bar is the shape.
export default function DayProgressBar({ progress }: { progress: DayProgress }) {
  const { done, total, extra } = progress;
  const complete = done >= total;

  return (
    <div>
      <div
        role="progressbar"
        aria-label="Today's plan"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        className="flex gap-0.5"
      >
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ease-strong ${
              i < done ? "bg-olive" : "bg-raised ring-1 ring-line-strong ring-inset"
            }`}
          />
        ))}
      </div>
      <p className="data mt-1.5 text-xs text-muted">
        {complete ? (
          <span className="text-olive">✓ Today&apos;s {total} done</span>
        ) : (
          `${done} of ${total} done today`
        )}
        {extra > 0 && <span className="text-faint"> · +{extra} extra</span>}
      </p>
    </div>
  );
}
