import Link from "next/link";
import { BUCKETS, bucketFor, daysUntil, formatShort, type Bucket } from "@/lib/checkpoints";
import { difficultyClass } from "@/lib/ui";
import type { Checkpoint, Question } from "@/lib/types";

export type AgendaRow = Checkpoint & {
  questions: Pick<Question, "id" | "leetcode_number" | "title" | "difficulty" | "topic">;
};

// Forward agenda. Every question has at most one dated, unfinished
// checkpoint, so each row is one active question. The Today bucket is the
// emphasized working set; the rest is outlook.
export default function UpcomingAgenda({ rows, today }: { rows: AgendaRow[]; today: string }) {
  const byBucket = new Map<Bucket, AgendaRow[]>();
  for (const row of rows) {
    const bucket = bucketFor(row.due_date!, today);
    byBucket.set(bucket, [...(byBucket.get(bucket) ?? []), row]);
  }

  return (
    <div className="flex flex-col gap-8">
      {BUCKETS.filter((b) => byBucket.has(b)).map((bucket) => {
        const entries = byBucket.get(bucket)!;
        const isToday = bucket === "Today";
        return (
          <section key={bucket}>
            <div className="mb-2 flex items-baseline gap-2">
              <h2 className={`text-sm font-medium ${isToday ? "text-ink" : "text-muted"}`}>
                {bucket}
              </h2>
              <span className="data text-xs text-faint">{entries.length}</span>
            </div>
            <ul
              className={`overflow-hidden rounded-xl border ${
                isToday ? "border-line-strong bg-surface" : "border-line"
              }`}
            >
              {entries.map((row) => (
                <AgendaEntry key={row.id} row={row} today={today} emphasized={isToday} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function AgendaEntry({
  row,
  today,
  emphasized,
}: {
  row: AgendaRow;
  today: string;
  emphasized: boolean;
}) {
  const d = daysUntil(row.due_date!, today);
  const overdue = d < 0;
  const when = overdue
    ? `${-d}d overdue`
    : d === 0
      ? "tonight"
      : d === 1
        ? "tomorrow"
        : formatShort(row.due_date!);

  return (
    <li className="border-b border-line last:border-b-0">
      <Link
        href={`/problems/${row.questions.id}`}
        className={`flex items-center justify-between gap-4 px-4 py-3 transition-colors duration-150 ${
          emphasized ? "hover:bg-raised" : "hover:bg-surface"
        }`}
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            <span className="data mr-2 text-faint">{row.questions.leetcode_number}</span>
            {row.questions.title}
          </p>
          <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted">
            <span className={difficultyClass[row.questions.difficulty]}>
              {row.questions.difficulty}
            </span>
            <span>{row.questions.topic}</span>
            <span>{row.is_catchup ? row.interval_label : `${row.interval_label} review`}</span>
          </p>
        </div>
        <span
          className={`data shrink-0 text-xs ${
            overdue ? "text-danger" : d === 0 ? "text-olive" : "text-muted"
          }`}
        >
          {when}
        </span>
      </Link>
    </li>
  );
}
