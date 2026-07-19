import { describe, expect, it } from "vitest";
import {
  cleanRate,
  difficultySplit,
  graduatedCount,
  maxActivityDay,
  quoteIndexFor,
  topicCoverage,
  topicCoverageWithQuality,
  weekLoad,
} from "./stats";
import type { Difficulty, Outcome } from "./types";

const TODAY = "2026-07-20";

const q = (difficulty: Difficulty, topic = "dp") => ({ difficulty, topic });

describe("difficultySplit", () => {
  it("is zero-safe", () => {
    const s = difficultySplit([]);
    expect(s.total).toBe(0);
    expect(s.pct.Easy).toBe(0);
  });

  it("computes counts and percentages", () => {
    const s = difficultySplit([q("Easy"), q("Easy"), q("Medium"), q("Hard")]);
    expect(s.counts).toEqual({ Easy: 2, Medium: 1, Hard: 1 });
    expect(s.pct.Easy).toBe(50);
    expect(s.pct.Easy + s.pct.Medium + s.pct.Hard).toBeCloseTo(100);
  });
});

describe("topicCoverage", () => {
  it("normalizes case/whitespace and sorts desc then alpha", () => {
    const topics = topicCoverage([
      q("Easy", "DP"),
      q("Easy", " dp "),
      q("Easy", "graphs"),
      q("Easy", "arrays"),
      q("Easy", "graphs"),
    ]);
    expect(topics).toEqual([
      { topic: "dp", count: 2 },
      { topic: "graphs", count: 2 },
      { topic: "arrays", count: 1 },
    ]);
  });
});

describe("topicCoverageWithQuality", () => {
  it("attaches per-topic review quality, null when unreviewed", () => {
    const questions = [
      { id: "q1", topic: "dp" },
      { id: "q2", topic: "DP" },
      { id: "q3", topic: "graphs" },
    ];
    const done = [
      { question_id: "q1", outcome: "clean" as const },
      { question_id: "q2", outcome: "failed" as const },
      { question_id: "q1", outcome: "clean" as const },
    ];
    const rows = topicCoverageWithQuality(questions, done);
    expect(rows).toEqual([
      { topic: "dp", count: 2, reviews: 3, cleanPct: 67 },
      { topic: "graphs", count: 1, reviews: 0, cleanPct: null },
    ]);
  });
});

describe("cleanRate", () => {
  const done = (...outcomes: Outcome[]) => outcomes.map((outcome) => ({ outcome }));
  it("is null with no completions", () => {
    expect(cleanRate([])).toBeNull();
  });
  it("rounds the clean percentage", () => {
    expect(cleanRate(done("clean", "clean", "failed"))).toBe(67);
  });
});

describe("graduatedCount", () => {
  const rung = (question_id: string, status: "done" | "locked", is_catchup = false) => ({
    question_id,
    status,
    is_catchup,
  });

  it("counts only fully-done ladders, ignoring catch-ups", () => {
    const cps = [
      // q1: both rungs done + an unfinished catch-up -> still graduated
      rung("q1", "done"),
      rung("q1", "done"),
      rung("q1", "locked", true),
      // q2: one rung pending
      rung("q2", "done"),
      rung("q2", "locked"),
    ];
    expect(graduatedCount(cps)).toBe(1);
  });

  it("is 0 with no checkpoints", () => {
    expect(graduatedCount([])).toBe(0);
  });
});

describe("weekLoad", () => {
  it("folds overdue into today and buckets the rest by date", () => {
    const pending = [
      { due_date: "2026-07-15" }, // overdue -> today
      { due_date: "2026-07-20" }, // today
      { due_date: "2026-07-22" },
      { due_date: "2026-07-26" },
      { due_date: "2026-08-01" }, // beyond the window -> excluded
    ];
    const load = weekLoad(pending, TODAY);
    expect(load).toHaveLength(7);
    expect(load[0]).toEqual({ date: "2026-07-20", count: 2 });
    expect(load[2]).toEqual({ date: "2026-07-22", count: 1 });
    expect(load[6]).toEqual({ date: "2026-07-26", count: 1 });
    expect(load.reduce((n, d) => n + d.count, 0)).toBe(4);
  });
});

describe("maxActivityDay", () => {
  it("is null when empty or all zero", () => {
    expect(maxActivityDay([])).toBeNull();
    expect(maxActivityDay([{ day: TODAY, solved: 0, reviewed: 0, total: 0 }])).toBeNull();
  });
  it("prefers the latest day on a tie", () => {
    const best = maxActivityDay([
      { day: "2026-07-18", solved: 2, reviewed: 1, total: 3 },
      { day: "2026-07-19", solved: 1, reviewed: 2, total: 3 },
    ]);
    expect(best?.day).toBe("2026-07-19");
  });
});

describe("quoteIndexFor", () => {
  it("is deterministic for a date and in range", () => {
    const a = quoteIndexFor(TODAY, 10);
    expect(quoteIndexFor(TODAY, 10)).toBe(a);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(10);
  });
  it("varies across dates", () => {
    const indices = new Set(
      ["2026-07-20", "2026-07-21", "2026-07-22", "2026-07-23", "2026-07-24"].map((d) =>
        quoteIndexFor(d, 10)
      )
    );
    expect(indices.size).toBeGreaterThan(1);
  });
  it("handles an empty list without dividing by zero", () => {
    expect(quoteIndexFor(TODAY, 0)).toBe(0);
  });
});
