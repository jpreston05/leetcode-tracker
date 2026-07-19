import type { Outcome } from "./types";

// 5-box Leitner system. Box n is reviewed after INTERVALS_DAYS[n] days.
export const MAX_BOX = 5;

export const INTERVALS_DAYS: Record<number, number> = {
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30,
};

/**
 * Apply a review outcome to a problem's current box.
 * Clean solve -> up one box (capped at 5). Anything else -> back to box 1.
 * The next review is scheduled from `from` (defaults to today, local time).
 */
export function applyReview(
  currentBox: number,
  outcome: Outcome,
  from: Date = new Date()
): { box: number; nextReviewDate: string } {
  const box = outcome === "clean" ? Math.min(currentBox + 1, MAX_BOX) : 1;
  return { box, nextReviewDate: addDays(from, INTERVALS_DAYS[box]) };
}

/** New problems start in box 1: first review one day after solving. */
export function scheduleNewProblem(dateSolved: Date = new Date()): {
  box: number;
  nextReviewDate: string;
} {
  return { box: 1, nextReviewDate: addDays(dateSolved, INTERVALS_DAYS[1]) };
}

/** YYYY-MM-DD in local time (avoids UTC off-by-one around midnight). */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

function addDays(from: Date, days: number): string {
  const next = new Date(from);
  next.setDate(next.getDate() + days);
  return toISODate(next);
}
