import { describe, expect, it } from "vitest";
import { buildTodayQueue, reviewsToShow, todayProgress, type QueueProblem } from "./queue";

const TODAY = "2026-07-20";
let n = 0;
const p = (next_due: string | null, retired_on: string | null = null): QueueProblem => ({
  id: `q${++n}`,
  leetcode_number: n,
  next_due,
  retired_on,
});

describe("buildTodayQueue", () => {
  it("shows 2 new slots when nothing is due", () => {
    const q = buildTodayQueue([p("2026-07-25")], TODAY, 0, 0);
    expect(q).toMatchObject({ reviews: [], moreDue: 0, newSlots: 2, newSlotsFilled: 0 });
  });

  it("shows 2 new slots with exactly 1 review due", () => {
    const q = buildTodayQueue([p(TODAY)], TODAY, 0, 0);
    expect(q.reviews).toHaveLength(1);
    expect(q.newSlots).toBe(2);
  });

  it("shows 1 new slot once 2 or more reviews are due", () => {
    expect(buildTodayQueue([p(TODAY), p(TODAY)], TODAY, 0, 0).newSlots).toBe(1);
  });

  it("caps reviews at 2, most overdue first, and counts the rest", () => {
    const problems = [p(TODAY), p("2026-07-15"), p("2026-07-19"), p("2026-07-10"), p(TODAY)];
    const q = buildTodayQueue(problems, TODAY, 0, 0);
    expect(q.reviews.map((r) => r.next_due)).toEqual(["2026-07-10", "2026-07-15"]);
    expect(q.due).toHaveLength(5);
    expect(q.moreDue).toBe(3);
  });

  it("counts reviews already done today against the cap", () => {
    const problems = [p(TODAY), p(TODAY), p(TODAY)];
    expect(buildTodayQueue(problems, TODAY, 0, 1).reviews).toHaveLength(1);
    const done = buildTodayQueue(problems, TODAY, 0, 2);
    expect(done.reviews).toEqual([]);
    expect(done.moreDue).toBe(3);
  });

  it("keeps 1 new slot after the day's reviews are finished", () => {
    // 2 reviews were due and both are done: still a normal day, not a light one
    expect(buildTodayQueue([], TODAY, 0, 2).newSlots).toBe(1);
  });

  it("ignores retired and future problems", () => {
    const q = buildTodayQueue([p(null, "2026-07-01"), p("2026-07-21")], TODAY, 0, 0);
    expect(q.due).toEqual([]);
  });

  it("marks today's first solves as filled slots, never above the slot count", () => {
    expect(buildTodayQueue([], TODAY, 1, 0).newSlotsFilled).toBe(1);
    expect(buildTodayQueue([p(TODAY), p(TODAY)], TODAY, 3, 0).newSlotsFilled).toBe(1);
  });
});

describe("todayProgress", () => {
  const progressFor = (due: number, solved: number, reviewed: number) =>
    todayProgress(buildTodayQueue(Array.from({ length: due }, () => p(TODAY)), TODAY, solved, reviewed));

  it("a normal day is 1 new + 2 reviews", () => {
    expect(progressFor(5, 0, 0)).toMatchObject({ done: 0, total: 3, extra: 0 });
  });
  it("fills as the new solve and reviews are logged", () => {
    expect(progressFor(4, 1, 1)).toMatchObject({ done: 2, total: 3, extra: 0 });
    expect(progressFor(3, 1, 2)).toMatchObject({ done: 3, total: 3, extra: 0 });
  });
  it("counts reviews past the plan as extra, not as a bigger bar", () => {
    expect(progressFor(2, 1, 3)).toMatchObject({ done: 3, total: 3, extra: 1 });
  });
  it("counts new problems past the slots as extra too", () => {
    expect(progressFor(5, 3, 2)).toMatchObject({ done: 3, total: 3, extra: 2 });
    expect(progressFor(2, 2, 3)).toMatchObject({ done: 3, total: 3, extra: 2 });
  });
  it("lists new segments first, then reviews, each marked done", () => {
    expect(progressFor(4, 1, 1).segments).toEqual([
      { kind: "new", done: true },
      { kind: "review", done: true },
      { kind: "review", done: false },
    ]);
  });
  it("a light day is 2 new + whatever is due", () => {
    expect(progressFor(0, 0, 0)).toMatchObject({ done: 0, total: 2, extra: 0 });
    expect(progressFor(1, 1, 0)).toMatchObject({ done: 1, total: 3, extra: 0 });
  });
});

describe("reviewsToShow", () => {
  const due = ["a", "b", "c", "d"];
  it("shows the remaining budget", () => {
    expect(reviewsToShow(due, 2, 0)).toEqual(["a", "b"]);
    expect(reviewsToShow(due, 2, 2)).toEqual([]);
  });
  it("shows exactly one more when the budget is raised past what's done", () => {
    expect(reviewsToShow(due, 3, 2)).toEqual(["a"]);
  });
  it("never goes negative", () => {
    expect(reviewsToShow(due, 2, 5)).toEqual([]);
  });
});
