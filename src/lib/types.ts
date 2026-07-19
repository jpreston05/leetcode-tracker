export type Difficulty = "Easy" | "Medium" | "Hard";
export type Outcome = "clean" | "struggled" | "failed";

export const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];
export const OUTCOMES: { value: Outcome; label: string }[] = [
  { value: "clean", label: "Solved cleanly" },
  { value: "struggled", label: "Struggled" },
  { value: "failed", label: "Failed" },
];

// Mirrors public.questions
export interface Question {
  id: string;
  leetcode_number: number;
  title: string;
  url: string;
  difficulty: Difficulty;
  topic: string;
  confidence: number; // 1-5
  date_solved: string; // YYYY-MM-DD
  leitner_box: number; // 1-5
  next_review_date: string; // YYYY-MM-DD
  notes: string | null;
  photo_path: string | null;
  created_at: string;
}

// Mirrors public.reviews
export interface Review {
  id: string;
  question_id: string;
  reviewed_on: string; // YYYY-MM-DD
  outcome: Outcome;
  time_taken_minutes: number | null;
  created_at: string;
}
