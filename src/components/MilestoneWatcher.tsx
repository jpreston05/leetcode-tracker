"use client";

import { useEffect } from "react";
import { useCelebrate } from "@/components/CelebrationProvider";
import { milestoneMessage, milestoneToCelebrate } from "@/lib/milestones";

const KEY = "celebrated-milestones";

/** Throws the milestone party once, on the day the milestone is crossed. */
export default function MilestoneWatcher({
  solvedDates,
  today,
  total,
}: {
  solvedDates: string[];
  today: string;
  total: number;
}) {
  const celebrate = useCelebrate();
  // Stable dependency: a new array every render would re-run the effect.
  const datesKey = solvedDates.join(",");

  useEffect(() => {
    let celebrated: number[] = [];
    try {
      celebrated = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    } catch {
      // corrupt entry: treat as nothing celebrated
    }
    const dates = datesKey ? datesKey.split(",") : [];
    const milestone = milestoneToCelebrate(dates, today, celebrated);
    if (milestone === null) return;
    localStorage.setItem(KEY, JSON.stringify([...celebrated, milestone]));
    celebrate({
      tone: "milestone",
      title: milestone >= total ? "You finished the 150!" : `${milestone} solved!`,
      body: milestoneMessage(milestone, total),
    });
  }, [datesKey, today, total, celebrate]);

  return null;
}
