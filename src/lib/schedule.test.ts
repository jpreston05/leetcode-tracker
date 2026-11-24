import { describe, expect, it } from "vitest";
import {
  buildHistory,
  computeSchedule,
  effectiveGrade,
  type HistoryItem,
} from "./schedule";
import type { Grade } from "./types";

const attempt = (date: string, grade: Grade | null, minutes: number | null = 10): HistoryItem => ({
  type: "attempt",
  date,
  grade,
  minutes,
});
const event = (kind: "defer" | "unretire", date: string): HistoryItem => ({ type: "event", kind, date });

describe("effectiveGrade", () => {
  it("keeps Clean within 15 minutes and a real gap", () => {
    expect(effectiveGrade("clean", 15, 3)).toBe("clean");
  });
  it("downgrades Clean over 15 minutes to Shaky", () => {
    expect(effectiveGrade("clean", 16, 3)).toBe("shaky");
  });
  it("downgrades a same-day Clean to Shaky", () => {
    expect(effectiveGrade("clean", 5, 0)).toBe("shaky");
  });
  it("leaves Shaky, Failed, and legacy null alone", () => {
    expect(effectiveGrade("shaky", 40, 0)).toBe("shaky");
    expect(effectiveGrade("failed", 5, 3)).toBe("failed");
    expect(effectiveGrade(null, null, 3)).toBe(null);
  });
  it("trusts a Clean with unknown minutes (migrated rows)", () => {
    expect(effectiveGrade("clean", null, 3)).toBe("clean");
  });
});

describe("computeSchedule — first solve", () => {
  it("is null with no attempts", () => {
    expect(computeSchedule([], 5)).toBeNull();
  });
  it.each([
    [5, 7],
    [4, 7],
    [3, 1],
    [1, 1],
  ])("confidence %i → first review in %i days", (confidence, days) => {
    expect(computeSchedule([attempt("2026-01-01", "clean")], confidence)).toEqual({
      intervalDays: days,
      nextDue: days === 7 ? "2026-01-08" : "2026-01-02",
      retiredOn: null,
    });
  });
  it("a Failed first solve is 1 day regardless of confidence", () => {
    expect(computeSchedule([attempt("2026-01-01", "failed")], 5)?.intervalDays).toBe(1);
  });
  it("a legacy ungraded first solve uses confidence", () => {
    expect(computeSchedule([attempt("2026-01-01", null, null)], 5)?.intervalDays).toBe(7);
  });
});

describe("computeSchedule — reviews", () => {
  it("happy path: conf 5, clean@7, clean@21 retires after 3 attempts", () => {
    const h = [attempt("2026-01-01", "clean"), attempt("2026-01-08", "clean")];
    expect(computeSchedule(h, 5)).toEqual({ intervalDays: 21, nextDue: "2026-01-29", retiredOn: null });
    expect(computeSchedule([...h, attempt("2026-01-29", "clean")], 5)).toEqual({
      intervalDays: 63,
      nextDue: null,
      retiredOn: "2026-01-29",
    });
  });

  it("Clean multiplies the ACTUAL gap, so a late review earns its full gap", () => {
    // due on day 1, done on day 4 → gap 3 → interval 9
    const h = [attempt("2026-01-01", "clean"), attempt("2026-01-04", "clean")];
    expect(computeSchedule(h, 2)).toEqual({ intervalDays: 9, nextDue: "2026-01-13", retiredOn: null });
  });

  it("Shaky repeats the previous interval", () => {
    const h = [attempt("2026-01-01", "clean"), attempt("2026-01-08", "shaky")];
    expect(computeSchedule(h, 5)).toEqual({ intervalDays: 7, nextDue: "2026-01-15", retiredOn: null });
  });

  it("Failed resets to 1 day", () => {
    const h = [
      attempt("2026-01-01", "clean"),
      attempt("2026-01-08", "clean"),
      attempt("2026-01-29", "failed"),
    ];
    expect(computeSchedule(h, 5)).toEqual({ intervalDays: 1, nextDue: "2026-01-30", retiredOn: null });
  });

  it("retires at a 21-day gap but not at 20", () => {
    const base = attempt("2026-01-01", "clean");
    expect(computeSchedule([base, attempt("2026-01-21", "clean")], 5)?.retiredOn).toBeNull();
    expect(computeSchedule([base, attempt("2026-01-22", "clean")], 5)?.retiredOn).toBe("2026-01-22");
  });

  it("a slow Clean counts as Shaky (no stretch, no retirement)", () => {
    const h = [attempt("2026-01-01", "clean"), attempt("2026-01-30", "clean", 20)];
    expect(computeSchedule(h, 5)).toEqual({ intervalDays: 7, nextDue: "2026-02-06", retiredOn: null });
  });

  it("a same-day second Clean counts as Shaky instead of zeroing the interval", () => {
    const h = [attempt("2026-01-01", "clean"), attempt("2026-01-01", "clean")];
    expect(computeSchedule(h, 5)).toEqual({ intervalDays: 7, nextDue: "2026-01-08", retiredOn: null });
  });

  it("logging an attempt on a retired problem brings it back", () => {
    const h = [
      attempt("2026-01-01", "clean"),
      attempt("2026-01-22", "clean"), // retires
      attempt("2026-03-01", "failed"),
    ];
    expect(computeSchedule(h, 5)).toEqual({ intervalDays: 1, nextDue: "2026-03-02", retiredOn: null });
  });
});

describe("computeSchedule — events", () => {
  it("unretire resets to 1 day and re-anchors the gap", () => {
    const h = [
      attempt("2026-01-01", "clean"),
      attempt("2026-01-22", "clean"), // retires
      event("unretire", "2026-06-01"),
    ];
    expect(computeSchedule(h, 5)).toEqual({ intervalDays: 1, nextDue: "2026-06-02", retiredOn: null });
    // the next review measures from the unretire date, not the old attempt
    expect(computeSchedule([...h, attempt("2026-06-02", "clean")], 5)).toEqual({
      intervalDays: 3,
      nextDue: "2026-06-05",
      retiredOn: null,
    });
  });

  it("defer pushes a due review to the next day without moving the anchor", () => {
    const h = [attempt("2026-01-01", "clean"), event("defer", "2026-01-08")];
    expect(computeSchedule(h, 5)?.nextDue).toBe("2026-01-09");
    // reviewed on the 9th: gap is 8 from the solve, not 1 from the defer
    expect(computeSchedule([...h, attempt("2026-01-09", "clean")], 5)?.intervalDays).toBe(24);
  });

  it("defer is a no-op when nothing is due yet", () => {
    const h = [attempt("2026-01-01", "clean"), event("defer", "2026-01-03")];
    expect(computeSchedule(h, 5)?.nextDue).toBe("2026-01-08");
  });

  it("defer is a no-op on a retired problem", () => {
    const h = [attempt("2026-01-01", "clean"), attempt("2026-01-22", "clean"), event("defer", "2026-02-01")];
    expect(computeSchedule(h, 5)).toMatchObject({ nextDue: null, retiredOn: "2026-01-22" });
  });
});

describe("buildHistory", () => {
  it("merges attempts and events by date then created_at", () => {
    const history = buildHistory(
      [
        { attempted_on: "2026-01-08", grade: "clean", minutes: 9, created_at: "2026-01-08T09:00:00Z" },
        { attempted_on: "2026-01-01", grade: null, minutes: null, created_at: "2026-01-01T09:00:00Z" },
      ],
      [{ kind: "defer", event_date: "2026-01-08", created_at: "2026-01-08T08:00:00Z" }]
    );
    expect(history.map((h) => [h.type, h.date])).toEqual([
      ["attempt", "2026-01-01"],
      ["event", "2026-01-08"],
      ["attempt", "2026-01-08"],
    ]);
  });
});
