/** Solved-count milestones worth a full celebration. */
export const MILESTONES = [10, 25, 50, 75, 100, 125, 150] as const;

/**
 * The milestone to celebrate now: the highest one crossed today (solved count
 * went from below it before today to at/above it now) that this browser
 * hasn't already celebrated. Tying it to the day it was crossed means a fresh
 * browser, device or preview URL (empty localStorage) never replays old
 * milestones; `celebrated` only dedupes repeat visits on the same day.
 */
export function milestoneToCelebrate(
  solvedDates: string[],
  today: string,
  celebrated: number[]
): number | null {
  const solved = solvedDates.length;
  const solvedBeforeToday = solvedDates.filter((d) => d < today).length;
  const crossedToday = MILESTONES.filter((m) => solvedBeforeToday < m && m <= solved);
  const highest = crossedToday.at(-1);
  if (highest === undefined || celebrated.includes(highest)) return null;
  return highest;
}

export function milestoneMessage(milestone: number, total: number): string {
  if (milestone >= total) return `All ${total} solved. You did the whole thing.`;
  if (milestone * 2 === total) return `Halfway there: ${milestone} of ${total} solved.`;
  return `${milestone} problems solved. ${total - milestone} to go.`;
}
