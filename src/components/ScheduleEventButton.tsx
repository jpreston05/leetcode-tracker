"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addScheduleEvent } from "@/lib/attempts";
import { todayISO } from "@/lib/dates";
import { createClient } from "@/lib/supabase/client";
import type { ScheduleEvent } from "@/lib/types";

const LABELS: Record<ScheduleEvent["kind"], { idle: string; busy: string }> = {
  defer: { idle: "Tomorrow", busy: "Moving…" },
  unretire: { idle: "Un-retire", busy: "Restoring…" },
};

/** Defer a due review to tomorrow, or bring a retired problem back (1-day interval). */
export default function ScheduleEventButton({
  questionId,
  kind,
}: {
  questionId: string;
  kind: ScheduleEvent["kind"];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      await addScheduleEvent(createClient(), questionId, kind, todayISO());
      router.refresh();
    } catch (err) {
      setError((err as { message?: string }).message ?? "Couldn't update the schedule.");
    }
    setBusy(false);
  }

  return (
    <>
      <button
        onClick={run}
        disabled={busy}
        title={kind === "defer" ? "Push this review to tomorrow" : "Back into review, due tomorrow"}
        className="btn-ghost"
      >
        {busy ? LABELS[kind].busy : LABELS[kind].idle}
      </button>
      {error && <p className="w-full text-sm text-danger">{error}</p>}
    </>
  );
}
