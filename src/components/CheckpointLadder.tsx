"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { daysUntil, formatShort, isActionable, todayISO } from "@/lib/checkpoints";
import { outcomeClass } from "@/lib/ui";
import { OUTCOMES, type Checkpoint, type Outcome } from "@/lib/types";

// Vertical stepper for a question's checkpoints. Exactly one rung is ever
// actionable; completion goes through the complete_checkpoint RPC, which
// re-enforces the lock server-side — this UI is just the front door.
export default function CheckpointLadder({ checkpoints }: { checkpoints: Checkpoint[] }) {
  const router = useRouter();
  const today = todayISO();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [linkDraft, setLinkDraft] = useState("");
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

  // Mis-tap safety net: today's completion can be reverted (the DB function
  // re-locks whatever it unlocked and clears the outcome).
  async function undo(cp: Checkpoint) {
    setBusy(true);
    setError(null);
    const { error } = await createClient().rpc("undo_checkpoint", { p_id: cp.id });
    if (error) setError(error.message);
    setBusy(false);
    router.refresh();
  }

  function openLinkEditor(cp: Checkpoint) {
    setError(null);
    setLinkDraft(cp.solution_url ?? "");
    setEditingLinkId(cp.id);
  }

  // Solve links can be attached long after the review; the set_checkpoint_solution
  // RPC is the only write path (checkpoints have no direct write RLS).
  async function saveSolution(cp: Checkpoint) {
    setBusy(true);
    setError(null);
    const { error } = await createClient().rpc("set_checkpoint_solution", {
      p_id: cp.id,
      p_url: linkDraft.trim(),
    });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    setEditingLinkId(null);
    setBusy(false);
    router.refresh();
  }

  return (
    <ol className="flex flex-col">
      {checkpoints.map((cp, i) => {
        const actionable = isActionable(cp, today);
        const isLast = i === checkpoints.length - 1;

        return (
          <li key={cp.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <Marker cp={cp} actionable={actionable} />
              {!isLast && <div className="w-px flex-1 bg-line" />}
            </div>

            <div className={`min-w-0 flex-1 ${isLast ? "" : "pb-5"}`}>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm">
                <span
                  className={
                    cp.status === "done"
                      ? "font-medium"
                      : actionable
                        ? "font-semibold"
                        : "text-faint"
                  }
                >
                  {cp.interval_label}
                  {cp.is_catchup ? "" : " review"}
                </span>
                <StatusText cp={cp} actionable={actionable} today={today} />
                {cp.status === "done" && cp.completed_date === today && (
                  <button
                    onClick={() => undo(cp)}
                    disabled={busy}
                    className="text-xs text-faint underline-offset-2 hover:text-ink hover:underline disabled:opacity-50"
                  >
                    Undo
                  </button>
                )}
              </div>

              {cp.status === "done" &&
                (editingLinkId === cp.id ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <input
                      type="url"
                      autoFocus
                      value={linkDraft}
                      onChange={(e) => setLinkDraft(e.target.value)}
                      placeholder="https://github.com/you/leetcode/…"
                      className="field w-full max-w-sm text-sm"
                    />
                    <button onClick={() => saveSolution(cp)} disabled={busy} className="btn-primary">
                      Save
                    </button>
                    <button
                      onClick={() => setEditingLinkId(null)}
                      disabled={busy}
                      className="btn-ghost"
                    >
                      Cancel
                    </button>
                    {error && <p className="w-full text-sm text-danger">{error}</p>}
                  </div>
                ) : cp.solution_url ? (
                  <div className="mt-1.5 flex items-center gap-3 text-xs">
                    <a
                      href={cp.solution_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted underline decoration-line-strong underline-offset-4 transition-colors duration-150 hover:text-ink"
                    >
                      GitHub ↗
                    </a>
                    <button
                      onClick={() => openLinkEditor(cp)}
                      className="text-faint underline-offset-2 hover:text-ink hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => openLinkEditor(cp)}
                    className="mt-1.5 text-xs text-faint underline-offset-2 hover:text-ink hover:underline"
                  >
                    + Add solve link
                  </button>
                ))}

              {actionable && confirmingId !== cp.id && (
                <button onClick={() => setConfirmingId(cp.id)} className="btn-primary mt-3">
                  Mark reviewed
                </button>
              )}

              {actionable && confirmingId === cp.id && (
                <div className="mt-3 flex flex-wrap items-center gap-2 transition-[opacity,transform] duration-150 ease-strong starting:translate-y-1 starting:opacity-0">
                  {OUTCOMES.map(({ value, label }) => (
                    <button
                      key={value}
                      disabled={busy}
                      onClick={() => complete(cp, value)}
                      className={
                        value === "clean"
                          ? "btn-primary"
                          : value === "struggled"
                            ? "btn border border-terra/50 text-terra hover:bg-terra/10"
                            : "btn border border-danger/50 text-danger hover:bg-danger/10"
                      }
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    onClick={() => setConfirmingId(null)}
                    disabled={busy}
                    className="btn-ghost"
                  >
                    Cancel
                  </button>
                  {error && <p className="w-full text-sm text-danger">{error}</p>}
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
  if (actionable) {
    return (
      <span className="rail-due flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-olive">
        <span className="h-1.5 w-1.5 rounded-full bg-olive" />
        <span className="sr-only">due now</span>
      </span>
    );
  }
  // scheduled (dated, future) or locked
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
        cp.due_date !== null ? "border-line-strong" : "border-line"
      }`}
    >
      {cp.due_date === null && (
        <svg aria-hidden width="10" height="10" viewBox="0 0 16 16" fill="none" className="text-faint">
          <rect x="3.25" y="7.25" width="9.5" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )}
      <span className="sr-only">{cp.due_date === null ? "locked" : "scheduled"}</span>
    </span>
  );
}

function StatusText({ cp, actionable, today }: { cp: Checkpoint; actionable: boolean; today: string }) {
  if (cp.status === "done") {
    return (
      <span className="text-xs text-muted">
        <span className="data">{formatShort(cp.completed_date!)}</span>
        <span className="mx-1.5 text-faint">·</span>
        <span className={outcomeClass[cp.outcome!]}>{cp.outcome}</span>
      </span>
    );
  }
  // Only the pending rung has a date — later dates are unknowable under
  // completion-anchored scheduling, so we never display them.
  if (cp.due_date !== null) {
    const d = daysUntil(cp.due_date, today);
    if (actionable) {
      return (
        <span className={`data text-xs ${d < 0 ? "text-danger" : "text-olive"}`}>
          {d === 0 ? "due tonight" : `${-d}d overdue`}
        </span>
      );
    }
    return <span className="data text-xs text-muted">due {formatShort(cp.due_date)}</span>;
  }
  return <span className="text-xs text-faint">unlocks after previous review</span>;
}
