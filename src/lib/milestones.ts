/** Solved-count milestones worth a full celebration. */
export const MILESTONES = [10, 25, 50, 75, 100, 125, 150] as const;

/**
 * The milestone to celebrate now: the highest one reached that hasn't been
 * celebrated yet. Only the highest, so a long gap never queues a string of
 * stale parties.
 */
export function milestoneToCelebrate(solved: number, celebrated: number[]): number | null {
  const reached = MILESTONES.filter((m) => m <= solved);
  const highest = reached.at(-1);
  if (highest === undefined || celebrated.includes(highest)) return null;
  return highest;
}

export function milestoneMessage(milestone: number, total: number): string {
  if (milestone >= total) return `All ${total} solved. You did the whole thing.`;
  if (milestone * 2 === total) return `Halfway there: ${milestone} of ${total} solved.`;
  return `${milestone} problems solved. ${total - milestone} to go.`;
}
