import { describe, expect, it } from "vitest";
import {
  LADDER,
  addDaysISO,
  bucketFor,
  computeStreaks,
  daysUntil,
} from "./checkpoints";

const TODAY = "2026-07-20";

describe("LADDER", () => {
  it("mirrors the SQL ladder", () => {
    expect(LADDER.map((r) => r.days)).toEqual([1, 3, 7, 14, 30, 90, 180]);
  });
});

describe("daysUntil", () => {
  it("handles same day, future, past, and month boundaries", () => {
    expect(daysUntil("2026-07-20", TODAY)).toBe(0);
    expect(daysUntil("2026-07-25", TODAY)).toBe(5);
    expect(daysUntil("2026-07-17", TODAY)).toBe(-3);
    expect(daysUntil("2026-08-03", TODAY)).toBe(14);
  });
});

describe("bucketFor", () => {
  it.each([
    ["2026-07-15", "Today"], // 5 days overdue
    ["2026-07-20", "Today"], // due today
    ["2026-07-21", "Tomorrow"],
    ["2026-07-22", "This week"], // +2
    ["2026-07-27", "This week"], // +7
    ["2026-07-28", "Next week"], // +8
    ["2026-08-03", "Next week"], // +14
    ["2026-08-04", "This month"], // +15
    ["2026-08-19", "This month"], // +30
    ["2026-08-20", "Later"], // +31
  ])("%s -> %s", (due, bucket) => {
    expect(bucketFor(due, TODAY)).toBe(bucket);
  });
});

describe("computeStreaks", () => {
  it("is 0/0 with no activity", () => {
    expect(computeStreaks([], TODAY)).toEqual({ current: 0, longest: 0 });
  });

  it("counts a run ending today", () => {
    expect(computeStreaks(["2026-07-18", "2026-07-19", "2026-07-20"], TODAY)).toEqual({
      current: 3,
      longest: 3,
    });
  });

  it("keeps the streak alive when today has no activity yet", () => {
    expect(computeStreaks(["2026-07-18", "2026-07-19"], TODAY)).toEqual({
      current: 2,
      longest: 2,
    });
  });

  it("breaks on a gap and remembers the longest run", () => {
    const days = ["2026-07-01", "2026-07-02", "2026-07-03", "2026-07-20"];
    expect(computeStreaks(days, TODAY)).toEqual({ current: 1, longest: 3 });
  });

  it("ignores duplicate days", () => {
    expect(computeStreaks(["2026-07-20", "2026-07-20"], TODAY)).toEqual({
      current: 1,
      longest: 1,
    });
  });
});

describe("addDaysISO", () => {
  it("crosses month and year boundaries", () => {
    expect(addDaysISO("2026-07-31", 1)).toBe("2026-08-01");
    expect(addDaysISO("2026-01-01", -1)).toBe("2025-12-31");
  });
});
