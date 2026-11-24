"use client";

import { useState } from "react";
import Link from "next/link";
import { formatShort } from "@/lib/dates";
import type { Question } from "@/lib/types";
import { difficultyChip, statusChip } from "@/lib/ui";

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
    <ul className="card overflow-hidden">
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
    <li className="border-b border-line last:border-b-0">
      <div className="flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-raised/60">
        <Link href={`/problems/${q.id}`} className="group flex min-w-0 flex-1 items-center gap-2">
          <span className="data text-faint">{q.leetcode_number}</span>
          <span className="truncate text-sm font-bold group-hover:text-brand-ink">{q.title}</span>
          <span className={`${difficultyChip[q.difficulty]} hidden shrink-0 sm:inline-flex`}>{q.difficulty}</span>
        </Link>

        <span className="hidden w-28 truncate text-sm text-muted sm:block">{q.topic}</span>
        <span className="data hidden w-24 text-right text-xs text-faint sm:block">{attemptsLabel}</span>
        <span className="flex w-24 shrink-0 justify-end">
          <StatusBadge q={q} today={today} />
        </span>

        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={`${open ? "Hide" : "Show"} details for ${q.title}`}
          className="-my-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-[background-color,transform] duration-150 ease-strong hover:bg-raised active:scale-[0.94] sm:hidden"
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
          <div className="px-4 pb-3.5">
            <p className="flex items-center gap-2 text-sm text-muted">
              <span className={difficultyChip[q.difficulty]}>{q.difficulty}</span>
              <span className="truncate">{q.topic}</span>
            </p>
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
  if (q.retired) return <span className={statusChip.retired}>retired</span>;
  // public rows have no schedule
  if (q.next_due === undefined) return <span className={statusChip.review}>in review</span>;
  if (q.next_due === null) return <span className="text-xs text-faint">—</span>;
  if (q.next_due < today) return <span className={statusChip.overdue}>late</span>;
  if (q.next_due === today) return <span className={statusChip.dueToday}>today</span>;
  return <span className="text-xs text-muted">{formatShort(q.next_due)}</span>;
}
