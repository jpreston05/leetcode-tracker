import type { Checkpoint } from "./types";

/** YYYY-MM-DD from a Date's local components (avoids UTC off-by-one). */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Today as an NZ calendar date regardless of runtime timezone — Vercel servers
 * run in UTC, up to a day behind the owner's wall clock. Matches nz_today()
 * in the database. (en-CA locale formats as YYYY-MM-DD.)
 */
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Pacific/Auckland" }).format(new Date());
}

/** Whole days from `today` to `dateISO`; negative = overdue. */
export function daysUntil(dateISO: string, today: string): number {
  // Noon avoids DST-shift off-by-ones.
  const target = new Date(`${dateISO}T12:00:00`);
  const base = new Date(`${today}T12:00:00`);
  return Math.round((target.getTime() - base.getTime()) / 86_400_000);
}

export function addDaysISO(iso: string, delta: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return toISODate(d);
}

/** e.g. "22 Jul" */
export function formatShort(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "short",
  });
}

/** The one rung the user can tick right now: unlocked, dated, due. */
export function isActionable(cp: Checkpoint, today: string): boolean {
  return cp.status !== "done" && cp.due_date !== null && cp.due_date <= today;
}

export const BUCKETS = [
  "Today",
  "Tomorrow",
  "This week",
  "Next week",
  "This month",
  "Later",
] as const;
export type Bucket = (typeof BUCKETS)[number];

/** Rolling buckets: overdue folds into Today; This week = 2-7 days out, etc. */
export function bucketFor(dueDate: string, today: string): Bucket {
  const d = daysUntil(dueDate, today);
  if (d <= 0) return "Today";
  if (d === 1) return "Tomorrow";
  if (d <= 7) return "This week";
  if (d <= 14) return "Next week";
  if (d <= 30) return "This month";
  return "Later";
}

/**
 * Streaks over days that had >= 1 activity event.
 * The current streak counts back from today, or from yesterday if today has
 * no activity yet (doing nothing *so far* today shouldn't zero the streak).
 */
export function computeStreaks(
  activeDays: string[],
  today: string
): { current: number; longest: number } {
  const set = new Set(activeDays);

  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of [...set].sort()) {
    run = prev !== null && daysUntil(day, prev) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = day;
  }

  let current = 0;
  let cursor = set.has(today) ? today : addDaysISO(today, -1);
  while (set.has(cursor)) {
    current++;
    cursor = addDaysISO(cursor, -1);
  }

  return { current, longest };
}
