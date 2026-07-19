import { describe, expect, it } from "vitest";
import { applyReview, INTERVALS_DAYS, scheduleNewProblem, toISODate } from "./leitner";

const day = (iso: string) => new Date(`${iso}T12:00:00`); // noon: immune to DST edges

describe("applyReview", () => {
  it("moves up one box on a clean solve", () => {
    expect(applyReview(1, "clean", day("2026-07-19"))).toEqual({
      box: 2,
      nextReviewDate: "2026-07-22", // +3 days (box 2)
    });
  });

  it("caps at box 5", () => {
    expect(applyReview(5, "clean", day("2026-07-19"))).toEqual({
      box: 5,
      nextReviewDate: "2026-08-18", // +30 days
    });
  });

  it.each(["struggled", "failed"] as const)("drops to box 1 on %s", (outcome) => {
    expect(applyReview(4, outcome, day("2026-07-19"))).toEqual({
      box: 1,
      nextReviewDate: "2026-07-20", // +1 day
    });
  });

  it("uses the correct interval for every box", () => {
    const from = day("2026-01-01");
    for (let currentBox = 1; currentBox <= 4; currentBox++) {
      const { box, nextReviewDate } = applyReview(currentBox, "clean", from);
      expect(box).toBe(currentBox + 1);
      const expected = new Date(from);
      expected.setDate(expected.getDate() + INTERVALS_DAYS[box]);
      expect(nextReviewDate).toBe(toISODate(expected));
    }
  });

  it("rolls over month boundaries", () => {
    expect(applyReview(2, "clean", day("2026-01-28")).nextReviewDate).toBe("2026-02-04");
  });
});

describe("scheduleNewProblem", () => {
  it("starts in box 1, due the next day", () => {
    expect(scheduleNewProblem(day("2026-07-19"))).toEqual({
      box: 1,
      nextReviewDate: "2026-07-20",
    });
  });
});
