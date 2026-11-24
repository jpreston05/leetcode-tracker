"use client";

import { useState } from "react";
import Link from "next/link";
import { formatShort } from "@/lib/dates";
import type { Question } from "@/lib/types";
import { difficultyClass } from "@/lib/ui";

// The list is shared between the owner logbook and the public portfolio; the
// public rows carry no next_due (schedule), so they show status only.
export type ProblemListRow = Pick<Question, "id" | "leetcode_number" | "title" | "difficulty" | "topic"> & {
  retired: boolean;
  next_due?: string | null;
  attempts: number;
};

// Responsive logbook list. Desktop shows topic + attempts inline; on phones
// those fold into a per-row disclosure (animated grid-rows, interruptible)
// instead of forcing the whole table to scroll sideways.
export default function ProblemsList({ rows, today }: { rows: ProblemListRow[]; today: string }) {
  return (
    <ul>
      {rows.map((q) => (
        <ProblemRow key={q.id} q={q} today={today} />
      ))}
    </ul>
  );
}

function ProblemRow({ q, today }: { q: ProblemListRow; today: string }) {
  const [open, setOpen] = useState(false);
  const attemptsLabel = `${q.attempts} attempt${q.attempts === 1 ? "" : "s"}`;

  return (
    <li className="border-b border-line/60">
      <div className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors duration-150 hover:bg-surface">
        <Link href={`/problems/${q.id}`} className="group flex min-w-0 flex-1 items-baseline gap-2">
          <span className="data text-faint">{q.leetcode_number}</span>
          <span className="truncate font-medium text-sm group-hover:text-ink">{q.title}</span>
          <span className={`text-xs ${difficultyClass[q.difficulty]}`}>{q.difficulty}</span>
        </Link>

        <span className="hidden w-28 truncate text-sm text-muted sm:block">{q.topic}</span>
        <span className="data hidden w-24 text-right text-xs text-faint sm:block">{attemptsLabel}</span>
        <span className="data w-16 shrink-0 text-right text-xs">
          <StatusBadge q={q} today={today} />
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
          <div className="pb-3.5">
            <p className="truncate text-sm text-muted">{q.topic}</p>
            <p className="data mt-1 text-xs text-faint">
              {attemptsLabel} ·{" "}
              {q.retired
                ? "retired"
                : q.next_due == null
                  ? "in review"
                  : q.next_due <= today
                    ? "due now"
                    : `due ${formatShort(q.next_due)}`}
            </p>
          </div>
        </div>
      </div>
    </li>
  );
}

function StatusBadge({ q, today }: { q: ProblemListRow; today: string }) {
  if (q.retired) return <span className="text-olive">retired</span>;
  // public rows have no schedule
  if (q.next_due === undefined) return <span className="text-muted">in review</span>;
  if (q.next_due === null) return <span className="text-faint">—</span>;
  if (q.next_due < today) return <span className="text-danger">overdue</span>;
  if (q.next_due === today) return <span className="text-olive">due</span>;
  return <span className="text-muted">{formatShort(q.next_due)}</span>;
}
