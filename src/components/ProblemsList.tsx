"use client";

import { useState } from "react";
import Link from "next/link";
import LadderRail from "./LadderRail";
import { formatShort } from "@/lib/checkpoints";
import { difficultyClass } from "@/lib/ui";
import type { Checkpoint, Question } from "@/lib/types";

// The list is shared between the owner logbook and the public portfolio; the
// public view drops due_date/interval_label (schedule) and passes hideSchedule.
export type ProblemListRow = Pick<
  Question,
  "id" | "leetcode_number" | "title" | "difficulty" | "topic"
> & {
  checkpoints: (Pick<Checkpoint, "sequence" | "status" | "is_catchup"> &
    Partial<Pick<Checkpoint, "interval_label" | "due_date">>)[];
};

// Responsive logbook list. Desktop shows topic + ladder inline; on phones
// those fold into a per-row disclosure (animated grid-rows, interruptible)
// instead of forcing the whole table to scroll sideways.
export default function ProblemsList({
  rows,
  today,
  hideSchedule = false,
}: {
  rows: ProblemListRow[];
  today: string;
  hideSchedule?: boolean;
}) {
  return (
    <ul>
      {rows.map((q) => (
        <ProblemRow key={q.id} q={q} today={today} hideSchedule={hideSchedule} />
      ))}
    </ul>
  );
}

function ProblemRow({
  q,
  today,
  hideSchedule,
}: {
  q: ProblemListRow;
  today: string;
  hideSchedule: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rungs = q.checkpoints.filter((c) => !c.is_catchup);
  const doneCount = rungs.filter((c) => c.status === "done").length;
  const graduated = rungs.length > 0 && doneCount === rungs.length;
  const pending = q.checkpoints.find((c) => c.status !== "done" && c.due_date != null);

  return (
    <li className="border-b border-line/60">
      <div className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors duration-150 hover:bg-surface">
        <Link
          href={`/problems/${q.id}`}
          className="group flex min-w-0 flex-1 items-baseline gap-2"
        >
          <span className="data text-faint">{q.leetcode_number}</span>
          <span className="truncate font-medium text-sm group-hover:text-ink">{q.title}</span>
          <span className={`text-xs ${difficultyClass[q.difficulty]}`}>{q.difficulty}</span>
        </Link>

        <span className="hidden w-28 truncate text-sm text-muted sm:block">{q.topic}</span>
        <div className="hidden w-24 sm:block">
          <LadderRail checkpoints={q.checkpoints} today={today} hideSchedule={hideSchedule} />
        </div>
        <span className="data w-16 shrink-0 text-right text-xs">
          {hideSchedule ? (
            <ProgressBadge doneCount={doneCount} total={rungs.length} graduated={graduated} />
          ) : (
            <NextBadge pending={pending} graduated={graduated} today={today} />
          )}
        </span>

        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={`${open ? "Hide" : "Show"} details for ${q.title}`}
          className="-my-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition-[background-color,transform] duration-150 ease-strong hover:bg-surface active:scale-[0.94] sm:hidden"
        >
          <svg
            aria-hidden
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            className={`transition-transform duration-200 ease-strong ${open ? "rotate-180" : ""}`}
          >
            <path
              d="m4 6 4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* mobile disclosure: grid-rows 0fr -> 1fr is interruptible and GPU-cheap */}
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-strong sm:hidden ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex items-center justify-between gap-4 pb-3.5">
            <div className="min-w-0">
              <p className="truncate text-sm text-muted">{q.topic}</p>
              <p className="data mt-1 text-xs text-faint">
                {hideSchedule
                  ? graduated
                    ? "all 7 reviews done"
                    : `${doneCount} of ${rungs.length} reviews done`
                  : graduated
                    ? "all 7 reviews done"
                    : pending
                      ? `${pending.interval_label}${pending.is_catchup ? "" : " review"} · ${
                          pending.due_date! <= today
                            ? "due now"
                            : `due ${formatShort(pending.due_date!)}`
                        }`
                      : "no reviews scheduled"}
              </p>
            </div>
            <div className="w-28 shrink-0">
              <LadderRail checkpoints={q.checkpoints} today={today} hideSchedule={hideSchedule} />
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

function NextBadge({
  pending,
  graduated,
  today,
}: {
  pending: ProblemListRow["checkpoints"][number] | undefined;
  graduated: boolean;
  today: string;
}) {
  if (graduated) return <span className="text-olive">done</span>;
  if (!pending || pending.due_date == null) return <span className="text-faint">—</span>;
  if (pending.due_date < today) return <span className="text-danger">overdue</span>;
  if (pending.due_date === today) return <span className="text-olive">due</span>;
  return <span className="text-muted">{formatShort(pending.due_date)}</span>;
}

// Public portfolio: progress along the ladder, no dates.
function ProgressBadge({
  doneCount,
  total,
  graduated,
}: {
  doneCount: number;
  total: number;
  graduated: boolean;
}) {
  if (graduated) return <span className="text-olive">done</span>;
  if (total === 0) return <span className="text-faint">—</span>;
  return (
    <span className="text-muted">
      {doneCount}/{total}
    </span>
  );
}
