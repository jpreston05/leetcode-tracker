"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { scheduleNewProblem, todayISO } from "@/lib/leitner";
import { DIFFICULTIES } from "@/lib/types";

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900";

export default function ProblemForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const form = new FormData(e.currentTarget);
    const dateSolved = form.get("date_solved") as string;
    // Noon local time keeps the date stable across timezones/DST.
    const { box, nextReviewDate } = scheduleNewProblem(new Date(`${dateSolved}T12:00:00`));

    const { error } = await createClient().from("questions").insert({
      leetcode_number: Number(form.get("leetcode_number")),
      title: form.get("title"),
      url: form.get("url"),
      difficulty: form.get("difficulty"),
      topic: form.get("topic"),
      confidence: Number(form.get("confidence")),
      date_solved: dateSolved,
      leitner_box: box,
      next_review_date: nextReviewDate,
      notes: (form.get("notes") as string) || null,
    });

    if (error) {
      setError(
        error.code === "23505"
          ? "That LeetCode number is already tracked."
          : error.message
      );
      setSaving(false);
      return;
    }

    router.push("/problems");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          LeetCode #
          <input name="leetcode_number" type="number" min={1} required className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Date solved
          <input name="date_solved" type="date" defaultValue={todayISO()} required className={inputClass} />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Title
        <input name="title" required placeholder="Two Sum" className={inputClass} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        URL
        <input
          name="url"
          type="url"
          required
          placeholder="https://leetcode.com/problems/two-sum/"
          className={inputClass}
        />
      </label>

      <div className="grid grid-cols-3 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Difficulty
          <select name="difficulty" required className={inputClass}>
            {DIFFICULTIES.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Topic
          <input name="topic" required placeholder="two-pointers" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Confidence (1–5)
          <select name="confidence" defaultValue="3" required className={inputClass}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Notes (optional)
        <textarea name="notes" rows={4} className={inputClass} />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="self-start rounded-lg bg-gray-900 px-5 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
      >
        {saving ? "Saving…" : "Add problem"}
      </button>
    </form>
  );
}
