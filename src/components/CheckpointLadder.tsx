"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { daysUntil, formatShort, isActionable, todayISO } from "@/lib/checkpoints";
import { OUTCOMES, type Checkpoint, type Outcome } from "@/lib/types";

// Vertical stepper for a question's checkpoints. Exactly one rung is ever
// actionable; completion goes through the complete_checkpoint RPC, which
// re-enforces the lock server-side — this UI is just the front door.
export default function CheckpointLadder({ checkpoints }: { checkpoints: Checkpoint[] }) {
  const router = useRouter();
  const today = todayISO();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function complete(cp: Checkpoint, outcome: Outcome) {
    setBusy(true);
    setError(null);
    const { error } = await createClient().rpc("complete_checkpoint", {
      p_id: cp.id,
      p_outcome: outcome,
    });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    setConfirmingId(null);
    setBusy(false);
    router.refresh();
  }

  return (
    <ol className="flex flex-col">
      {checkpoints.map((cp, i) => {
        const actionable = isActionable(cp, today);
        const isLast = i === checkpoints.length - 1;

        return (
          <li key={cp.id} className="flex gap-3">
            {/* rail: state marker + connector line */}
            <div className="flex flex-col items-center">
              <Marker cp={cp} actionable={actionable} />
              {!isLast && <div className="w-px flex-1 bg-gray-200 dark:bg-gray-800" />}
            </div>

            <div className={`flex-1 pb-5 ${cp.status !== "done" && !actionable ? "text-gray-400 dark:text-gray-600" : ""}`}>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                <span className={actionable ? "font-semibold" : "font-medium"}>
                  {cp.interval_label}
                  {cp.is_catchup ? "" : " review"}
                </span>
                <StatusText cp={cp} actionable={actionable} today={today} />
              </div>

              {actionable && confirmingId !== cp.id && (
                <button
                  onClick={() => setConfirmingId(cp.id)}
                  className="mt-2 rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
                >
                  Mark reviewed
                </button>
              )}

              {actionable && confirmingId === cp.id && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {OUTCOMES.map(({ value, label }) => (
                    <button
                      key={value}
                      disabled={busy}
                      onClick={() => complete(cp, value)}
                      className={`rounded-md px-3 py-1.5 text-sm text-white disabled:opacity-50 ${
                        value === "clean"
                          ? "bg-green-700 hover:bg-green-600"
                          : value === "struggled"
                            ? "bg-amber-600 hover:bg-amber-500"
                            : "bg-red-700 hover:bg-red-600"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    onClick={() => setConfirmingId(null)}
                    disabled={busy}
                    className="text-sm text-gray-500 hover:underline"
                  >
                    Cancel
                  </button>
                  {error && <p className="w-full text-sm text-red-600">{error}</p>}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Marker({ cp, actionable }: { cp: Checkpoint; actionable: boolean }) {
  if (cp.status === "done") {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-700 text-xs text-white">
        ✓
      </span>
    );
  }
  if (actionable) {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-900 dark:border-gray-100" />
    );
  }
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-xs dark:border-gray-700">
      🔒
    </span>
  );
}

function StatusText({ cp, actionable, today }: { cp: Checkpoint; actionable: boolean; today: string }) {
  if (cp.status === "done") {
    return (
      <span className="text-gray-500">
        done {formatShort(cp.completed_date!)} · {cp.outcome}
      </span>
    );
  }
  // The pending rung is the only one with a date — later dates are unknowable
  // under completion-anchored scheduling, so we never display them.
  if (cp.due_date !== null) {
    const d = daysUntil(cp.due_date, today);
    if (actionable) {
      return (
        <span className="text-gray-500">
          {d === 0 ? "due today" : `${-d} day${d === -1 ? "" : "s"} overdue`}
        </span>
      );
    }
    return <span>due {formatShort(cp.due_date)}</span>;
  }
  return <span>unlocks after previous review</span>;
}
