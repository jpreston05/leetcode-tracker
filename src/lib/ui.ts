import type { Difficulty, Outcome } from "./types";

// Shared text-color vocabulary. Color never stands alone — it always
// accompanies the written label.
export const difficultyClass: Record<Difficulty, string> = {
  Easy: "text-olive",
  Medium: "text-terra",
  Hard: "text-danger",
};

export const outcomeClass: Record<Outcome, string> = {
  clean: "text-olive",
  struggled: "text-terra",
  failed: "text-danger",
};

const KEEP_UPPER = new Set(["ii", "iii", "iv", "vi", "vii", "viii", "ix", "xi"]);

/** "https://leetcode.com/problems/two-sum-ii/…" -> "Two Sum II" (null if no slug). */
export function titleFromLeetCodeUrl(url: string): string | null {
  const slug = url.match(/leetcode\.com\/problems\/([a-z0-9-]+)/i)?.[1];
  if (!slug) return null;
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => (KEEP_UPPER.has(w.toLowerCase()) ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}
