import type { Difficulty, Grade } from "./types";

// Shared text-color vocabulary. Color never stands alone — it always
// accompanies the written label.
export const difficultyClass: Record<Difficulty, string> = {
  Easy: "text-mint-ink",
  Medium: "text-amber-ink",
  Hard: "text-coral-ink",
};

/** Difficulty as a pill: tinted background + its ink. */
export const difficultyChip: Record<Difficulty, string> = {
  Easy: "chip bg-mint-soft text-mint-ink",
  Medium: "chip bg-amber-soft text-amber-ink",
  Hard: "chip bg-coral-soft text-coral-ink",
};

export const gradeClass: Record<Grade, string> = {
  clean: "text-mint-ink",
  shaky: "text-amber-ink",
  failed: "text-coral-ink",
};

export const gradeChip: Record<Grade, string> = {
  clean: "chip bg-mint-soft text-mint-ink",
  shaky: "chip bg-amber-soft text-amber-ink",
  failed: "chip bg-coral-soft text-coral-ink",
};

/** Status pills: retired is grape, reviews are sky, overdue is coral. */
export const statusChip = {
  retired: "chip bg-grape-soft text-grape-ink",
  review: "chip bg-sky-soft text-sky-ink",
  overdue: "chip bg-coral-soft text-coral-ink",
  dueToday: "chip bg-sky text-on-fill",
} as const;

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
