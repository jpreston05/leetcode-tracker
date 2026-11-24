"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCelebrate } from "@/components/CelebrationProvider";
import GradeFields from "@/components/GradeFields";
import { logAttempt, updateAttempt } from "@/lib/attempts";
import { todayISO } from "@/lib/dates";
import { createClient } from "@/lib/supabase/client";
import type { Attempt, Grade } from "@/lib/types";

/**
 * Log a new attempt on a question, or edit an existing one (`initial`).
 * A new attempt that retires the problem gets a celebration.
 */
export default function LogAttemptForm({
  questionId,
  title,
  initial,
  onDone,
}: {
  questionId: string;
  title: string;
  initial?: Attempt;
  onDone: () => void;
}) {
  const router = useRouter();
  const celebrate = useCelebrate();
  const [minutes, setMinutes] = useState(initial?.minutes?.toString() ?? "");
  const [grade, setGrade] = useState<Grade | null>(initial?.grade ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Migrated rows may lack a grade/time; don't force one onto them when editing.
  const legacyGrade = initial !== undefined && initial.grade === null;
  const legacyMinutes = initial !== undefined && initial.minutes === null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (grade === null && !legacyGrade) {
      setError("Pick a grade.");
      return;
    }
    setBusy(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const values = {
      attempted_on: form.get("attempted_on") as string,
      minutes: minutes ? Number(minutes) : null,
      grade,
      solution_url: (form.get("solution_url") as string).trim() || null,
      notes: (form.get("notes") as string).trim() || null,
    };

    try {
      const supabase = createClient();
      if (initial) {
        await updateAttempt(supabase, initial, values);
      } else {
        const schedule = await logAttempt(supabase, questionId, values);
        if (schedule?.retiredOn === values.attempted_on) {
          celebrate({ tone: "retire", title: "Retired!", body: `${title} is locked in. It's out of your queue for good.` });
        }
      }
    } catch (err) {
      setError((err as { message?: string }).message ?? "Couldn't save the attempt.");
      setBusy(false);
      return;
    }
    onDone();
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 transition-[opacity,transform] duration-200 ease-strong starting:translate-y-1 starting:opacity-0"
    >
      <label className="flex max-w-48 flex-col gap-1.5 text-sm font-semibold text-muted">
        Date
        <input
          name="attempted_on"
          type="date"
          required
          max={todayISO()}
          defaultValue={initial?.attempted_on ?? todayISO()}
          className="field data"
        />
      </label>

      <GradeFields
        minutes={minutes}
        grade={grade}
        onMinutesChange={setMinutes}
        onGradeChange={setGrade}
        minutesRequired={!legacyMinutes}
      />

      <label className="flex flex-col gap-1.5 text-sm font-semibold text-muted">
        GitHub link <span className="font-normal text-faint">(optional)</span>
        <input
          name="solution_url"
          type="url"
          defaultValue={initial?.solution_url ?? ""}
          placeholder="https://github.com/you/leetcode/…"
          className="field"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-semibold text-muted">
        Notes <span className="font-normal text-faint">(optional)</span>
        <textarea
          name="notes"
          rows={2}
          defaultValue={initial?.notes ?? ""}
          placeholder="What tripped you up?"
          className="field resize-y"
        />
      </label>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? "Saving…" : initial ? "Save attempt" : "Log attempt"}
        </button>
        <button type="button" onClick={onDone} disabled={busy} className="btn-ghost">
          Cancel
        </button>
      </div>
    </form>
  );
}
