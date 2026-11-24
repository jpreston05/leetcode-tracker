import type { Question } from "./types";

/** Reviews in a normal day; the rest roll forward unless you ask for more. */
export const MAX_DAILY_REVIEWS = 2;

export type QueueProblem = Pick<Question, "id" | "leetcode_number" | "next_due" | "retired_on">;

export interface TodayQueue<P extends QueueProblem> {
  due: P[]; // every review still due, most overdue first
  reviews: P[]; // the ones to show: MAX_DAILY_REVIEWS minus reviews already done today
  moreDue: number; // due but not shown
  reviewedToday: number;
  newSlots: number; // 1, or 2 on a light review day
  newSlotsFilled: number; // first solves already logged today
}

/** Active problems due on or before today, most overdue first. */
export function dueReviews<P extends QueueProblem>(problems: P[], today: string): P[] {
  return problems
    .filter((p) => p.retired_on === null && p.next_due !== null && p.next_due <= today)
    .sort((a, b) => a.next_due!.localeCompare(b.next_due!) || a.leetcode_number - b.leetcode_number);
}

/**
 * The reviews still on today's plate. `allowance` is the day's review budget:
 * MAX_DAILY_REVIEWS normally, raised by one each time you ask for the next.
 */
export function reviewsToShow<P>(due: P[], allowance: number, reviewedToday: number): P[] {
  return due.slice(0, Math.max(0, allowance - reviewedToday));
}

export interface DayProgress {
  done: number;
  total: number; // the day's plan: new slots + planned reviews (normally 3)
  extra: number; // reviews beyond the plan, via "Try the next one"
}

/** How far through today's plan you are. */
export function todayProgress(queue: TodayQueue<QueueProblem>): DayProgress {
  const plannedReviews = Math.min(MAX_DAILY_REVIEWS, queue.due.length + queue.reviewedToday);
  const reviewsDone = Math.min(queue.reviewedToday, plannedReviews);
  return {
    done: queue.newSlotsFilled + reviewsDone,
    total: queue.newSlots + plannedReviews,
    extra: queue.reviewedToday - reviewsDone,
  };
}

/**
 * Today's work: up to 2 reviews (minus those already done today) plus 1
 * new-problem slot, or 2 when the day's review load is under 2. Nothing is
 * rescheduled here: reviews that don't fit are simply still due tomorrow,
 * where most-overdue-first keeps them moving.
 */
export function buildTodayQueue<P extends QueueProblem>(
  problems: P[],
  today: string,
  solvedToday: number,
  reviewedToday: number
): TodayQueue<P> {
  const due = dueReviews(problems, today);
  const reviews = reviewsToShow(due, MAX_DAILY_REVIEWS, reviewedToday);
  // judge the day by its whole load, so finishing reviews doesn't add a slot
  const newSlots = due.length + reviewedToday < 2 ? 2 : 1;
  return {
    due,
    reviews,
    moreDue: due.length - reviews.length,
    reviewedToday,
    newSlots,
    newSlotsFilled: Math.min(solvedToday, newSlots),
  };
}
