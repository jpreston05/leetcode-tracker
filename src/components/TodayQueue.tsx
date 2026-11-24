"use client";

import { useState } from "react";
import Link from "next/link";
import LogAttemptForm from "@/components/LogAttemptForm";
import ScheduleEventButton from "@/components/ScheduleEventButton";
import { daysUntil } from "@/lib/dates";
import { MAX_DAILY_REVIEWS, reviewsToShow, type TodayQueue as Queue } from "@/lib/queue";
import type { Question } from "@/lib/types";
import { difficultyClass } from "@/lib/ui";

export type QueueRow = Pick<
  Question,
  "id" | "leetcode_number" | "title" | "difficulty" | "topic" | "next_due" | "retired_on" | "interval_days"
>;

/**
 * Today's work: new-problem slot(s), then up to 2 reviews. Once those are
 * done, "Try the next one" raises the day's budget by one review at a time.
 * The budget is client state, so it survives the refresh after each log.
 */
export default function TodayQueue({ queue, today }: { queue: Queue<QueueRow>; today: string }) {
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [allowance, setAllowance] = useState(MAX_DAILY_REVIEWS);
  const reviews = reviewsToShow(queue.due, allowance, queue.reviewedToday);
  const moreDue = queue.due.length - reviews.length;

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-2 text-sm font-medium text-ink">New</h2>
        <ul className="overflow-hidden rounded-xl border border-line-strong bg-surface">
          {Array.from({ length: queue.newSlots }, (_, i) => {
            const filled = i < queue.newSlotsFilled;
            return (
              <li key={i} className="border-b border-line last:border-b-0">
                {filled ? (
                  <p className="px-4 py-3 text-sm text-muted">
                    <span className="text-olive">✓</span> New problem logged
                  </p>
                ) : (
                  <Link
                    href="/problems/new"
                    className="flex items-center justify-between gap-4 px-4 py-3 text-sm transition-colors duration-150 hover:bg-raised"
                  >
                    <span>Solve a new problem</span>
                    <span className="text-xs text-muted">Log it →</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <div className="mb-2 flex items-baseline gap-2">
          <h2 className="text-sm font-medium text-ink">Reviews</h2>
          <span className="data text-xs text-faint">
            {queue.reviewedToday > 0 ? `${queue.reviewedToday} done · ` : ""}
            {reviews.length} to go
          </span>
        </div>
        {reviews.length === 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
            <p className="text-sm text-muted">
              {queue.reviewedToday > 0 ? (
                <>
                  <span className="text-olive">✓</span> Today&apos;s reviews are done.
                </>
              ) : (
                "Nothing due. Nice."
              )}
            </p>
            {moreDue > 0 && (
              <button onClick={() => setAllowance(queue.reviewedToday + 1)} className="btn-secondary">
                Try the next one
              </button>
            )}
          </div>
        ) : (
          <ul className="overflow-hidden rounded-xl border border-line-strong bg-surface">
            {reviews.map((row) => {
              const late = -daysUntil(row.next_due!, today);
              return (
                <li key={row.id} className="border-b border-line px-4 py-3 last:border-b-0">
                  <div className="flex items-center justify-between gap-4">
                    <Link href={`/problems/${row.id}`} className="min-w-0 hover:underline">
                      <p className="truncate text-sm font-medium">
                        <span className="data mr-2 text-faint">{row.leetcode_number}</span>
                        {row.title}
                      </p>
                      <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted">
                        <span className={difficultyClass[row.difficulty]}>{row.difficulty}</span>
                        <span>{row.topic}</span>
                        <span className="data">{row.interval_days}-day gap</span>
                      </p>
                    </Link>
                    <span className={`data shrink-0 text-xs ${late > 0 ? "text-danger" : "text-olive"}`}>
                      {late > 0 ? `${late}d overdue` : "today"}
                    </span>
                  </div>
                  {loggingId === row.id ? (
                    <div className="mt-4">
                      <LogAttemptForm questionId={row.id} onDone={() => setLoggingId(null)} />
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
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
          <p className="data mt-2 text-xs text-faint">
            +{moreDue} more due · they&apos;ll roll into the next few days
          </p>
        )}
      </section>
    </div>
  );
}
