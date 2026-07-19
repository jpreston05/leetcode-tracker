"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { applyReview } from "@/lib/leitner";
import { OUTCOMES, type Outcome } from "@/lib/types";

interface Props {
  questionId: string;
  currentBox: number;
}

// "Review now" controls: pick an outcome (+ optional minutes) ->
// append a reviews row, then reschedule the question.
export default function ReviewDialog({ questionId, currentBox }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [minutes, setMinutes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(outcome: Outcome) {
    setBusy(true);
    setError(null);
    const supabase = createClient();

    // 1. Append to the review log (never overwritten).
    const { error: reviewError } = await supabase.from("reviews").insert({
      question_id: questionId,
      outcome,
      time_taken_minutes: minutes ? Number(minutes) : null,
    });
    if (reviewError) {
      setError(reviewError.message);
      setBusy(false);
      return;
    }

    // 2. Move the question to its new box and schedule the next review.
    const { box, nextReviewDate } = applyReview(currentBox, outcome);
    const { error: updateError } = await supabase
      .from("questions")
      .update({ leitner_box: box, next_review_date: nextReviewDate })
      .eq("id", questionId);
    if (updateError) {
      setError(`Review logged, but rescheduling failed: ${updateError.message}`);
      setBusy(false);
      return;
    }

    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
      >
        Review now
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="number"
        min={1}
        placeholder="min"
        value={minutes}
        onChange={(e) => setMinutes(e.target.value)}
        className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900"
        aria-label="Time taken in minutes"
      />
      {OUTCOMES.map(({ value, label }) => (
        <button
          key={value}
          disabled={busy}
          onClick={() => submit(value)}
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
        onClick={() => setOpen(false)}
        disabled={busy}
        className="text-sm text-gray-500 hover:underline"
      >
        Cancel
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </div>
  );
}
