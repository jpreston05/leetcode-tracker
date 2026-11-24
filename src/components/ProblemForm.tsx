"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import GradeFields from "@/components/GradeFields";
import { logAttempt, recomputeQuestion } from "@/lib/attempts";
import { todayISO } from "@/lib/dates";
import { createClient } from "@/lib/supabase/client";
import { DIFFICULTIES, type Grade, type Question } from "@/lib/types";
import { titleFromLeetCodeUrl } from "@/lib/ui";

// Create + edit form. Creating also logs the first solve as attempt #1 (its
// time + grade, with confidence, set the first review). Editing changes the
// problem's details only; the solve date and grades live in its attempts.
export default function ProblemForm({ initial }: { initial?: Question }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [minutes, setMinutes] = useState("");
  const [grade, setGrade] = useState<Grade | null>(null);

  // Paste a LeetCode URL -> prefill the title from its slug (only if empty).
  function autofillFromUrl(url: string) {
    if (title.trim()) return;
    const parsed = titleFromLeetCodeUrl(url);
    if (parsed) setTitle(parsed);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!initial && grade === null) {
      setError("Pick a grade for this solve.");
      return;
    }
    setError(null);
    setSaving(true);

    const form = new FormData(e.currentTarget);
    const solvedOn = (form.get("date_solved") as string | null) ?? initial!.date_solved;
    const values = {
      leetcode_number: Number(form.get("leetcode_number")),
      title: form.get("title"),
      url: form.get("url"),
      difficulty: form.get("difficulty"),
      topic: form.get("topic"),
      confidence: Number(form.get("confidence")),
      date_solved: solvedOn,
      notes: (form.get("notes") as string) || null,
      solution_url: (form.get("solution_url") as string).trim() || null,
    };

    const supabase = createClient();
    const { data, error } = initial
      ? await supabase.from("questions").update(values).eq("id", initial.id).select("id").single()
      : await supabase.from("questions").insert(values).select("id").single();

    if (error) {
      setError(
        error.code === "23505"
          ? "That LeetCode number is already tracked."
          : error.message
      );
      setSaving(false);
      return;
    }

    try {
      if (initial) {
        await recomputeQuestion(supabase, data.id); // confidence sets the first interval
      } else {
        await logAttempt(supabase, data.id, {
          attempted_on: solvedOn,
          minutes: Number(minutes),
          grade,
          solution_url: null, // the problem's own GitHub link covers the first solve
          notes: null,
        });
      }
    } catch (err) {
      // The problem is saved; the dashboard self-heals an unscheduled question.
      setError((err as { message?: string }).message ?? "Saved, but scheduling failed.");
      setSaving(false);
      return;
    }

    // Land on the problem's page so its notes photos can be attached immediately.
    router.push(`/problems/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-muted">
        URL
        <input
          name="url"
          type="url"
          required
          defaultValue={initial?.url}
          placeholder="https://leetcode.com/problems/two-sum/"
          className="field"
          onBlur={(e) => autofillFromUrl(e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-semibold text-muted">
        Title
        <input
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Two Sum"
          className="field"
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-muted">
          LeetCode number
          <input
            name="leetcode_number"
            type="number"
            min={1}
            required
            defaultValue={initial?.leetcode_number}
            placeholder="1"
            className="field data"
          />
        </label>
        {!initial && (
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-muted">
            Date solved
            <input
              name="date_solved"
              type="date"
              defaultValue={todayISO()}
              max={todayISO()}
              required
              className="field data"
            />
          </label>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-muted">
          Difficulty
          <select name="difficulty" required defaultValue={initial?.difficulty} className="field">
            {DIFFICULTIES.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-muted">
          Topic
          <input
            name="topic"
            required
            defaultValue={initial?.topic}
            placeholder="two-pointers"
            className="field"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-muted">
          Confidence
          <select
            name="confidence"
            defaultValue={initial?.confidence ?? 3}
            required
            className="field data"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} / 5
              </option>
            ))}
          </select>
        </label>
      </div>

      {!initial && (
        <GradeFields minutes={minutes} grade={grade} onMinutesChange={setMinutes} onGradeChange={setGrade} />
      )}

      <label className="flex flex-col gap-1.5 text-sm font-semibold text-muted">
        GitHub solution <span className="font-normal text-faint">(optional)</span>
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
          rows={4}
          defaultValue={initial?.notes ?? ""}
          placeholder="Key insight, pattern, the thing future-you forgets…"
          className="field resize-y"
        />
      </label>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button type="submit" disabled={saving} className="btn-primary self-start">
        {saving ? "Saving…" : initial ? "Save changes" : "Add to logbook ✨"}
      </button>
    </form>
  );
}
