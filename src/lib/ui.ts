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
