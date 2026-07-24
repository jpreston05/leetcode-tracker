import { outcomeClass } from "@/lib/ui";
import type { PublicCheckpoint } from "@/lib/types";

// Read-only review ladder for the public portfolio: shows how far a problem
// has climbed and links each review's solve, without the schedule or any
// write controls. The owner sees the interactive CheckpointLadder instead.
export default function PublicLadder({ checkpoints }: { checkpoints: PublicCheckpoint[] }) {
  // Number the real rungs 1..N; catch-ups share their rung's sequence and are
  // labelled as such rather than counted.
  return (
    <ol className="flex flex-col">
      {checkpoints.map((cp, i) => {
        const isLast = i === checkpoints.length - 1;
        const done = cp.status === "done";
        return (
          <li key={`${cp.question_id}-${cp.sequence}-${i}`} className="flex gap-4">
            <div className="flex flex-col items-center">
              <Marker done={done} />
              {!isLast && <div className="w-px flex-1 bg-line" />}
            </div>

            <div className={`min-w-0 flex-1 ${isLast ? "" : "pb-5"}`}>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm">
                <span className={done ? "font-medium" : "text-faint"}>
                  {cp.is_catchup ? "catch-up review" : `Review ${cp.sequence}`}
                </span>
                {done ? (
                  cp.outcome && (
                    <span className={`text-xs ${outcomeClass[cp.outcome]}`}>{cp.outcome}</span>
                  )
                ) : (
                  <span className="text-xs text-faint">to come</span>
                )}
              </div>

              {done && cp.solution_url && (
                <a
                  href={cp.solution_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 inline-block text-xs text-muted underline decoration-line-strong underline-offset-4 transition-colors duration-150 hover:text-ink"
                >
                  GitHub ↗
                </a>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Marker({ done }: { done: boolean }) {
  if (done) {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-olive text-on-olive">
        <svg aria-hidden width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path
            d="M3 8.5 6.5 12 13 4.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="sr-only">done</span>
      </span>
    );
  }
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line">
      <span className="sr-only">to come</span>
    </span>
  );
}
