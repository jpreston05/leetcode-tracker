import { describe, expect, it } from "vitest";
import { milestoneMessage, milestoneToCelebrate } from "./milestones";

const TODAY = "2026-11-26";
const days = (n: number, date: string) => Array<string>(n).fill(date);

describe("milestoneToCelebrate", () => {
  it("is null below the first milestone", () => {
    expect(milestoneToCelebrate(days(9, TODAY), TODAY, [])).toBeNull();
  });
  it("celebrates a milestone crossed today", () => {
    expect(milestoneToCelebrate([...days(9, "2026-11-20"), TODAY], TODAY, [])).toBe(10);
  });
  it("never replays a milestone crossed on an earlier day, even with empty storage", () => {
    expect(milestoneToCelebrate(days(12, "2026-11-20"), TODAY, [])).toBeNull();
    expect(milestoneToCelebrate([...days(10, "2026-11-20"), TODAY], TODAY, [])).toBeNull();
  });
  it("only celebrates the highest milestone crossed today", () => {
    expect(milestoneToCelebrate([...days(8, "2026-11-20"), ...days(20, TODAY)], TODAY, [])).toBe(25);
  });
  it("doesn't repeat a milestone already celebrated today", () => {
    expect(milestoneToCelebrate([...days(9, "2026-11-20"), TODAY], TODAY, [10])).toBeNull();
  });
});

describe("milestoneMessage", () => {
  it("has special copy for halfway and the finish", () => {
    expect(milestoneMessage(75, 150)).toMatch(/Halfway/);
    expect(milestoneMessage(150, 150)).toMatch(/All 150/);
    expect(milestoneMessage(25, 150)).toBe("25 problems solved. 125 to go.");
  });
});
