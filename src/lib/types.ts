export type Difficulty = "Easy" | "Medium" | "Hard";
export type Outcome = "clean" | "struggled" | "failed";
export type CheckpointStatus = "locked" | "available" | "done";

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
  notes: string | null;
  photo_path: string | null;
  created_at: string;
}

// Mirrors public.checkpoints: one scheduled review of one question.
// Ladder rungs (sequence 1-7) are pre-created; catch-up rows share their
// rung's sequence with is_catchup = true.
export interface Checkpoint {
  id: string;
  question_id: string;
  sequence: number; // 1-7
  is_catchup: boolean;
  interval_days: number;
  interval_label: string;
  due_date: string | null; // null while locked (unknown until predecessor completes)
  status: CheckpointStatus;
  completed_date: string | null;
  outcome: Outcome | null;
  created_at: string;
}
