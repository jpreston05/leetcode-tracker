"use client";

import { useEffect } from "react";
import { useCelebrate } from "@/components/CelebrationProvider";
import { milestoneMessage, milestoneToCelebrate } from "@/lib/milestones";

const KEY = "celebrated-milestones";

/** Throws the milestone party once per milestone, the first time it's seen. */
export default function MilestoneWatcher({ solved, total }: { solved: number; total: number }) {
  const celebrate = useCelebrate();

  useEffect(() => {
    let celebrated: number[] = [];
    try {
      celebrated = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    } catch {
      // corrupt entry: treat as nothing celebrated
    }
    const milestone = milestoneToCelebrate(solved, celebrated);
    if (milestone === null) return;
    localStorage.setItem(KEY, JSON.stringify([...celebrated, milestone]));
    celebrate({
      tone: "milestone",
      title: milestone >= total ? "You finished the 150!" : `${milestone} solved!`,
      body: milestoneMessage(milestone, total),
    });
  }, [solved, total, celebrate]);

  return null;
}
