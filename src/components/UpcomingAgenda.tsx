import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  BUCKETS,
  bucketFor,
  daysUntil,
  formatShort,
  todayISO,
  type Bucket,
} from "@/lib/checkpoints";
import type { Checkpoint, Question } from "@/lib/types";

type AgendaRow = Checkpoint & {
  questions: Pick<Question, "id" | "leetcode_number" | "title" | "difficulty" | "topic">;
};

// Every question has at most one dated, unfinished checkpoint (the pending
// rung), so this query is exactly "one agenda entry per active question".
export default async function UpcomingAgenda() {
  const supabase = await createClient();
  const today = todayISO();

  const { data: rows, error } = await supabase
    .from("checkpoints")
    .select("*, questions(id, leetcode_number, title, difficulty, topic)")
    .neq("status", "done")
    .not("due_date", "is", null)
    .order("due_date")
    .overrideTypes<AgendaRow[]>();

  if (error) return <p className="text-sm text-red-600">{error.message}</p>;

  if (!rows?.length) {
    return (
      <p className="text-sm text-gray-500">
        No reviews scheduled. Solve something new and{" "}
        <Link href="/problems/new" className="underline">
          add it
        </Link>
        .
      </p>
    );
  }

  const byBucket = new Map<Bucket, AgendaRow[]>();
  for (const row of rows) {
    const bucket = bucketFor(row.due_date!, today);
    byBucket.set(bucket, [...(byBucket.get(bucket) ?? []), row]);
  }

  return (
    <div className="flex flex-col gap-6">
      {BUCKETS.filter((b) => byBucket.has(b)).map((bucket) => {
        const entries = byBucket.get(bucket)!;
        return (
          <section key={bucket}>
            <h2 className="mb-2 text-sm font-semibold text-gray-500">
              {bucket} <span className="font-normal">· {entries.length}</span>
            </h2>
            <ul className="flex flex-col gap-2">
              {entries.map((row) => (
                <AgendaEntry key={row.id} row={row} today={today} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function AgendaEntry({ row, today }: { row: AgendaRow; today: string }) {
  const d = daysUntil(row.due_date!, today);
  const when =
    d < 0
      ? `${-d} day${d === -1 ? "" : "s"} overdue`
      : d === 0
        ? "due today"
        : `${formatShort(row.due_date!)} · in ${d} day${d === 1 ? "" : "s"}`;

  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <Link href={`/problems/${row.questions.id}`} className="text-sm font-medium hover:underline">
          {row.questions.leetcode_number}. {row.questions.title}
        </Link>
        <span className="text-xs text-gray-500">
          {row.questions.difficulty} · {row.questions.topic} ·{" "}
          {row.is_catchup ? row.interval_label : `${row.interval_label} review`}
        </span>
      </div>
      <span className={`text-xs ${d < 0 ? "text-red-600" : "text-gray-500"}`}>{when}</span>
    </li>
  );
}
