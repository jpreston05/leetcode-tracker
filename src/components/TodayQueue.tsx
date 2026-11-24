"use client";

import { useState } from "react";
import Link from "next/link";
import LogAttemptForm from "@/components/LogAttemptForm";
import LogOtherReview, { type PickableProblem } from "@/components/LogOtherReview";
import ScheduleEventButton from "@/components/ScheduleEventButton";
import { daysUntil } from "@/lib/dates";
import { MAX_DAILY_REVIEWS, reviewsToShow, type TodayQueue as Queue } from "@/lib/queue";
import type { Question } from "@/lib/types";
import { difficultyChip, statusChip } from "@/lib/ui";

export type QueueRow = Pick<
  Question,
  "id" | "leetcode_number" | "title" | "difficulty" | "topic" | "next_due" | "retired_on" | "interval_days"
>;

/**
 * Today's work: new-problem slot(s) in sun, then up to 2 review cards in sky.
 * Once those are done, "Try the next one" raises the day's budget by one
 * review at a time. The budget is client state, so it survives the refresh
 * after each log.
 */
export default function TodayQueue({
  queue,
  today,
  allProblems,
}: {
  queue: Queue<QueueRow>;
  today: string;
  allProblems: PickableProblem[];
}) {
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [allowance, setAllowance] = useState(MAX_DAILY_REVIEWS);
  const reviews = reviewsToShow(queue.due, allowance, queue.reviewedToday);
  const moreDue = queue.due.length - reviews.length;

  return (
    <div className="flex flex-col gap-8">
      <section>
        <SectionHeading dot="bg-sun-mark" title="New problem" detail={queue.newSlots > 1 ? "light day: try two" : undefined} />
        <ul className="grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(14rem,1fr))]">
          {Array.from({ length: queue.newSlots }, (_, i) =>
            i < queue.newSlotsFilled ? (
              <li
                key={i}
                className="flex items-center gap-3 rounded-2xl border border-mint/40 bg-mint-soft px-4 py-4 text-sm font-semibold text-mint-ink"
              >
                <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-mint text-on-fill">
                  ✓
                </span>
                New problem logged
              </li>
            ) : (
              <li key={i}>
                <Link
                  href="/problems/new"
                  className="group flex items-center gap-3 rounded-2xl border border-sun-mark/30 bg-sun-soft px-4 py-4 transition-[transform,box-shadow] duration-200 ease-strong hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <span
                    aria-hidden
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-sun text-lg font-bold text-on-fill transition-transform duration-200 ease-strong group-hover:rotate-90"
                  >
                    +
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-bold text-ink">Solve something new</span>
                    <span className="block text-xs text-muted">Pick the next one from the 150</span>
                  </span>
                  <span aria-hidden className="text-sun-ink transition-transform duration-200 ease-strong group-hover:translate-x-0.5">
                    →
                  </span>
                </Link>
              </li>
            )
          )}
        </ul>
      </section>

      <section>
        <SectionHeading
          dot="bg-sky-mark"
          title="Reviews"
          detail={`${queue.reviewedToday > 0 ? `${queue.reviewedToday} done · ` : ""}${reviews.length} to go`}
        />
        {reviews.length === 0 ? (
          <div className="card flex flex-wrap items-center justify-between gap-3 px-4 py-4">
            <p className="flex items-center gap-3 text-sm font-semibold">
              {queue.reviewedToday > 0 ? (
                <>
                  <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-mint text-on-fill">
                    ✓
                  </span>
                  <span className="text-mint-ink">Reviews done. Lovely work.</span>
                </>
              ) : (
                <>
                  <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-soft text-base">
                    ☀️
                  </span>
                  <span className="text-muted">Nothing to review today.</span>
                </>
              )}
            </p>
            {moreDue > 0 && (
              <button onClick={() => setAllowance(queue.reviewedToday + 1)} className="btn-secondary">
                Try the next one →
              </button>
            )}
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {reviews.map((row) => {
              const late = -daysUntil(row.next_due!, today);
              return (
                <li key={row.id} className="card overflow-hidden">
                  <div className="flex items-start justify-between gap-4 px-4 pt-4">
                    <Link href={`/problems/${row.id}`} className="group min-w-0">
                      <p className="truncate font-bold group-hover:text-brand-ink">
                        <span className="data mr-2 font-normal text-faint">{row.leetcode_number}</span>
                        {row.title}
                      </p>
                      <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                        <span className={difficultyChip[row.difficulty]}>{row.difficulty}</span>
                        <span>{row.topic}</span>
                        <span className="data">· {row.interval_days}-day gap</span>
                      </p>
                    </Link>
                    <span className={`data shrink-0 ${late > 0 ? statusChip.overdue : statusChip.dueToday}`}>
                      {late > 0 ? `${late}d late` : "today"}
                    </span>
                  </div>
                  {loggingId === row.id ? (
                    <div className="mt-4 border-t border-line bg-raised/50 px-4 py-4">
                      <LogAttemptForm questionId={row.id} title={row.title} onDone={() => setLoggingId(null)} />
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2 px-4 pt-3 pb-4">
                      <button onClick={() => setLoggingId(row.id)} className="btn-primary">
                        Log attempt
                      </button>
                      <ScheduleEventButton questionId={row.id} kind="defer" />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {moreDue > 0 && (
          <p className="data mt-2.5 text-xs text-muted">
            +{moreDue} more due · they&apos;ll roll into the next few days
          </p>
        )}
        {/* reviewed something the queue didn't suggest? log it here */}
        <LogOtherReview problems={allProblems.filter((p) => !reviews.some((r) => r.id === p.id))} />
      </section>
    </div>
  );
}

function SectionHeading({ dot, title, detail }: { dot: string; title: string; detail?: string }) {
  return (
    <div className="mb-3 flex items-baseline gap-2">
      <span aria-hidden className={`h-2.5 w-2.5 translate-y-[-1px] self-center rounded-full ${dot}`} />
      <h2 className="font-bold">{title}</h2>
      {detail && <span className="data text-xs text-muted">{detail}</span>}
    </div>
  );
}
