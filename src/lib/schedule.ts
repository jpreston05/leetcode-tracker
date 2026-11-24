import { addDaysISO, daysUntil } from "./dates";
import type { Attempt, Grade, ScheduleEvent } from "./types";

/** A solve over this many minutes can't be graded Clean. */
export const CLEAN_MAX_MINUTES = 15;
/** A Clean review after at least this many days retires the problem. */
export const RETIRE_GAP_DAYS = 21;

export interface AttemptInput {
  date: string; // YYYY-MM-DD
  grade: Grade | null; // null = migrated legacy solve with no grade
  minutes: number | null;
}

export interface ScheduleEventInput {
  kind: "defer" | "unretire";
  date: string;
}

export interface Schedule {
  intervalDays: number;
  nextDue: string | null; // null when retired
  retiredOn: string | null;
}

/** Either an attempt or a manual event, in the order they happened. */
export type HistoryItem =
  | ({ type: "attempt" } & AttemptInput)
  | ({ type: "event" } & ScheduleEventInput);

/** Merges attempt + event rows into one history sorted by (date, created_at). */
export function buildHistory(
  attempts: Pick<Attempt, "attempted_on" | "grade" | "minutes" | "created_at">[],
  events: Pick<ScheduleEvent, "kind" | "event_date" | "created_at">[]
): HistoryItem[] {
  const rows = [
    ...attempts.map((a) => ({
      key: [a.attempted_on, a.created_at] as const,
      item: { type: "attempt", date: a.attempted_on, grade: a.grade, minutes: a.minutes } as HistoryItem,
    })),
    ...events.map((e) => ({
      key: [e.event_date, e.created_at] as const,
      item: { type: "event", kind: e.kind, date: e.event_date } as HistoryItem,
    })),
  ];
  rows.sort((a, b) => a.key[0].localeCompare(b.key[0]) || a.key[1].localeCompare(b.key[1]));
  return rows.map((r) => r.item);
}

/**
 * The grade that actually counts. Clean needs ≤15 minutes, and a Clean with
 * no gap (a second attempt the same day) proves nothing, so both drop to Shaky.
 */
export function effectiveGrade(
  grade: Grade | null,
  minutes: number | null,
  gapDays: number
): Grade | null {
  if (grade !== "clean") return grade;
  if (minutes !== null && minutes > CLEAN_MAX_MINUTES) return "shaky";
  if (gapDays < 1) return "shaky";
  return "clean";
}

/** Days until the first review, from the first solve's confidence and grade. */
export function firstInterval(confidence: number, grade: Grade | null): number {
  if (grade === "failed") return 1;
  return confidence >= 4 ? 7 : 1;
}

/**
 * Replays a problem's whole history to get its current schedule. Nothing is
 * ever patched in place: editing or deleting an attempt just replays again.
 *
 * `history` must be sorted by (date, created_at). The first attempt is the
 * first solve; returns null when there are no attempts.
 */
export function computeSchedule(history: HistoryItem[], confidence: number): Schedule | null {
  let state: Schedule | null = null;
  let anchor = ""; // date the current gap is measured from

  for (const item of history) {
    if (item.type === "event") {
      if (state === null) continue; // events before the first solve mean nothing
      if (item.kind === "unretire") {
        state = { intervalDays: 1, nextDue: addDaysISO(item.date, 1), retiredOn: null };
        anchor = item.date;
      } else if (state.nextDue !== null && state.nextDue <= item.date) {
        // defer: push a due review to the next day; the anchor stays, so the
        // late review still earns its full gap
        state = { intervalDays: state.intervalDays, nextDue: addDaysISO(item.date, 1), retiredOn: null };
      }
      continue;
    }

    if (state === null) {
      const interval = firstInterval(confidence, item.grade);
      state = { intervalDays: interval, nextDue: addDaysISO(item.date, interval), retiredOn: null };
      anchor = item.date;
      continue;
    }

    // A review (logging one on a retired problem simply un-retires it).
    const gap = daysUntil(item.date, anchor);
    const grade = effectiveGrade(item.grade, item.minutes, gap);
    anchor = item.date;

    if (grade === "clean" && gap >= RETIRE_GAP_DAYS) {
      state = { intervalDays: gap * 3, nextDue: null, retiredOn: item.date };
      continue;
    }

    let interval: number;
    if (grade === "clean") interval = gap * 3;
    else if (grade === "failed") interval = 1;
    else interval = Math.max(state.intervalDays, 1); // shaky, or legacy ungraded

    state = { intervalDays: interval, nextDue: addDaysISO(item.date, interval), retiredOn: null };
  }

  return state;
}
