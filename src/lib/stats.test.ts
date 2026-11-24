import { describe, expect, it } from "vitest";
import {
  cleanRate,
  difficultySplit,
  maxActivityDay,
  progress,
  reviewsOf,
  quoteIndexFor,
  topicCoverage,
  topicCoverageWithQuality,
  weekLoad,
} from "./stats";
import type { Difficulty, Grade } from "./types";

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
    const reviews = [
      { question_id: "q1", grade: "clean" as const },
      { question_id: "q2", grade: "failed" as const },
      { question_id: "q1", grade: "clean" as const },
    ];
    const rows = topicCoverageWithQuality(questions, reviews);
    expect(rows).toEqual([
      { topic: "dp", count: 2, reviews: 3, cleanPct: 67 },
      { topic: "graphs", count: 1, reviews: 0, cleanPct: null },
    ]);
  });
});

describe("cleanRate", () => {
  const done = (...grades: Grade[]) => grades.map((grade) => ({ grade }));
  it("is null with no reviews", () => {
    expect(cleanRate([])).toBeNull();
  });
  it("rounds the clean percentage", () => {
    expect(cleanRate(done("clean", "clean", "failed"))).toBe(67);
  });
});

describe("reviewsOf", () => {
  it("drops the earliest attempt per question (date, then created_at)", () => {
    const a = (question_id: string, attempted_on: string, created_at = "t1") => ({
      question_id,
      attempted_on,
      created_at,
      grade: "clean" as const,
    });
    const attempts = [a("q1", "2026-07-08"), a("q1", "2026-07-01"), a("q2", "2026-07-02", "t2"), a("q2", "2026-07-02", "t1")];
    expect(reviewsOf(attempts)).toEqual([attempts[0], attempts[2]]);
  });
});

describe("progress", () => {
  it("splits solved into in-review and retired, out of 150", () => {
    expect(progress([{ retired_on: null }, { retired_on: "2026-07-01" }, { retired_on: null }])).toEqual({
      solved: 3,
      inReview: 2,
      retired: 1,
      total: 150,
    });
  });
});

describe("weekLoad", () => {
  it("folds overdue into today and buckets the rest by date", () => {
    const pending = [
      { next_due: "2026-07-15", retired_on: null }, // overdue -> today
      { next_due: "2026-07-20", retired_on: null }, // today
      { next_due: "2026-07-22", retired_on: null },
      { next_due: "2026-07-26", retired_on: null },
      { next_due: "2026-08-01", retired_on: null }, // beyond the window -> excluded
      { next_due: null, retired_on: "2026-07-01" }, // retired -> excluded
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
