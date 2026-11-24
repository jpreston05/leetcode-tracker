"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LogAttemptForm from "@/components/LogAttemptForm";
import { deleteAttempt } from "@/lib/attempts";
import { formatShort } from "@/lib/dates";
import { createClient } from "@/lib/supabase/client";
import { GRADES, type Attempt } from "@/lib/types";
import { gradeClass } from "@/lib/ui";

const linkClass =
  "text-muted underline decoration-line-strong underline-offset-4 transition-colors duration-150 hover:text-ink";
const actionClass = "text-xs text-faint underline-offset-2 hover:text-ink hover:underline disabled:opacity-50";

/**
 * A question's attempts, oldest first. Editing or deleting one replays the
 * whole history, so the schedule always matches what's listed here.
 */
export default function AttemptHistory({
  questionId,
  attempts,
}: {
  questionId: string;
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
      <ol className="flex flex-col">
        {attempts.map((attempt, i) => (
          <li key={attempt.id} className="border-b border-line py-3 last:border-b-0">
            {editingId === attempt.id ? (
              <LogAttemptForm questionId={questionId} initial={attempt} onDone={() => setEditingId(null)} />
            ) : (
              <>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm">
                  <span className="data text-muted">{formatShort(attempt.attempted_on)}</span>
                  <span className="text-xs text-faint">{i === 0 ? "first solve" : `review ${i}`}</span>
                  {attempt.grade ? (
                    <span className={`font-medium ${gradeClass[attempt.grade]}`}>
                      {GRADES.find((g) => g.value === attempt.grade)!.label}
                    </span>
                  ) : (
                    <span className="text-faint">ungraded</span>
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
          <LogAttemptForm questionId={questionId} onDone={() => setAdding(false)} />
        ) : (
          <button onClick={() => setAdding(true)} className="btn-secondary">
            Log attempt
          </button>
        )}
      </div>
    </div>
  );
}
