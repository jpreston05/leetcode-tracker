import { describe, expect, it } from "vitest";
import { titleFromLeetCodeUrl } from "./ui";

describe("titleFromLeetCodeUrl", () => {
  it("title-cases the slug", () => {
    expect(titleFromLeetCodeUrl("https://leetcode.com/problems/two-sum/")).toBe("Two Sum");
    expect(
      titleFromLeetCodeUrl("https://leetcode.com/problems/longest-substring-without-repeating-characters")
    ).toBe("Longest Substring Without Repeating Characters");
  });

  it("keeps roman numerals uppercase", () => {
    expect(titleFromLeetCodeUrl("https://leetcode.com/problems/two-sum-ii/")).toBe("Two Sum II");
  });

  it("handles description sub-paths and query strings", () => {
    expect(
      titleFromLeetCodeUrl("https://leetcode.com/problems/3sum/description/?envType=daily")
    ).toBe("3sum");
  });

  it("returns null for non-problem URLs", () => {
    expect(titleFromLeetCodeUrl("https://leetcode.com/problemset/")).toBeNull();
    expect(titleFromLeetCodeUrl("not a url")).toBeNull();
  });
});
