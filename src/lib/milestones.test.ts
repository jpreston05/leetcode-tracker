import { describe, expect, it } from "vitest";
import { milestoneMessage, milestoneToCelebrate } from "./milestones";

describe("milestoneToCelebrate", () => {
  it("is null below the first milestone", () => {
    expect(milestoneToCelebrate(9, [])).toBeNull();
  });
  it("celebrates a milestone exactly when reached", () => {
    expect(milestoneToCelebrate(10, [])).toBe(10);
  });
  it("only celebrates the highest uncelebrated milestone", () => {
    expect(milestoneToCelebrate(53, [])).toBe(50);
    expect(milestoneToCelebrate(53, [10])).toBe(50);
  });
  it("never repeats a celebrated milestone", () => {
    expect(milestoneToCelebrate(60, [50])).toBeNull();
  });
});

describe("milestoneMessage", () => {
  it("has special copy for halfway and the finish", () => {
    expect(milestoneMessage(75, 150)).toMatch(/Halfway/);
    expect(milestoneMessage(150, 150)).toMatch(/All 150/);
    expect(milestoneMessage(25, 150)).toBe("25 problems solved. 125 to go.");
  });
});
