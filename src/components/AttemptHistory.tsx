"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LogAttemptForm from "@/components/LogAttemptForm";
import { deleteAttempt } from "@/lib/attempts";
import { formatShort } from "@/lib/dates";
import { createClient } from "@/lib/supabase/client";
import { GRADES, type Attempt } from "@/lib/types";
import { gradeChip } from "@/lib/ui";

const linkClass =
  "text-muted underline decoration-line-strong underline-offset-4 transition-colors duration-150 hover:text-ink";
const actionClass = "text-xs text-faint underline-offset-2 hover:text-ink hover:underline disabled:opacity-50";

/**
 * A question's attempts, oldest first. Editing or deleting one replays the
 * whole history, so the schedule always matches what's listed here.
 */
export default function AttemptHistory({
  questionId,
  title,
  attempts,
}: {
  questionId: string;
  title: string;
  attempts: Attempt[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function remove(attempt: Attempt) {
    if (!confirm(`Delete the ${formatShort(attempt.attempted_on)} attempt? The schedule will be recomputed.`)) return;
    setBusyId(attempt.id);
    setError(null);
    try {
      await deleteAttempt(createClient(), attempt);
      router.refresh();
    } catch (err) {
      setError((err as { message?: string }).message ?? "Couldn't delete the attempt.");
    }
    setBusyId(null);
  }

  return (
    <div>
      {/* a timeline: one dot per attempt, sun for the first solve, sky for reviews */}
      <ol className="relative flex flex-col">
        <span aria-hidden className="absolute top-3 bottom-3 left-[7px] w-0.5 rounded-full bg-line" />
        {attempts.map((attempt, i) => (
          <li key={attempt.id} className="relative py-2.5 pl-7">
            <span
              aria-hidden
              className={`absolute top-[15px] left-0 h-4 w-4 rounded-full border-[3px] border-surface ${
                i === 0 ? "bg-sun-mark" : "bg-sky-mark"
              }`}
            />
            {editingId === attempt.id ? (
              <div className="rounded-2xl bg-raised/60 p-4">
                <LogAttemptForm questionId={questionId} title={title} initial={attempt} onDone={() => setEditingId(null)} />
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="data font-semibold">{formatShort(attempt.attempted_on)}</span>
                  <span className="text-xs text-muted">{i === 0 ? "first solve" : `review ${i}`}</span>
                  {attempt.grade ? (
                    <span className={gradeChip[attempt.grade]}>
                      {GRADES.find((g) => g.value === attempt.grade)!.label}
                    </span>
                  ) : (
                    <span className="chip bg-raised text-muted">ungraded</span>
                  )}
                  {attempt.minutes !== null && <span className="data text-muted">{attempt.minutes} min</span>}
                  {attempt.solution_url && (
                    <a href={attempt.solution_url} target="_blank" rel="noreferrer" className={`text-xs ${linkClass}`}>
                      GitHub ↗
                    </a>
                  )}
                  <span className="ml-auto flex gap-3">
                    <button onClick={() => setEditingId(attempt.id)} className={actionClass}>
                      Edit
                    </button>
                    {/* The first solve anchors the problem; delete the problem instead. */}
                    {i > 0 && (
                      <button onClick={() => remove(attempt)} disabled={busyId !== null} className={actionClass}>
                        {busyId === attempt.id ? "Deleting…" : "Delete"}
                      </button>
                    )}
                  </span>
                </div>
                {attempt.notes && (
                  <p className="mt-1 max-w-[65ch] text-sm whitespace-pre-wrap text-muted">{attempt.notes}</p>
                )}
              </>
            )}
          </li>
        ))}
      </ol>

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      <div className="mt-4">
        {adding ? (
          <div className="rounded-2xl bg-raised/60 p-4">
            <LogAttemptForm questionId={questionId} title={title} onDone={() => setAdding(false)} />
          </div>
        ) : (
          <button onClick={() => setAdding(true)} className="btn-primary">
            + Log attempt
          </button>
        )}
      </div>
    </div>
  );
}
