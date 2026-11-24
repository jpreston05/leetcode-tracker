export type Difficulty = "Easy" | "Medium" | "Hard";
export type Grade = "clean" | "shaky" | "failed";

export const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];
export const GRADES: { value: Grade; label: string; hint: string }[] = [
  { value: "clean", label: "Clean", hint: "On my own, ≤15 min, no real bugs" },
  { value: "shaky", label: "Shaky", hint: "On my own, but slow or buggy" },
  { value: "failed", label: "Failed", hint: "Needed a hint/solution, or didn't finish" },
];

/** Problems in the NeetCode 150 — the denominator for overall progress. */
export const TOTAL_PROBLEMS = 150;

// Mirrors public.questions. interval_days / next_due / retired_on are a cache
// derived by replaying attempts through computeSchedule (src/lib/schedule.ts).
export interface Question {
  id: string;
  leetcode_number: number;
  title: string;
  url: string;
  difficulty: Difficulty;
  topic: string;
  confidence: number; // 1-5, given at first solve
  date_solved: string; // YYYY-MM-DD
  notes: string | null;
  solution_url: string | null; // canonical GitHub link for the problem
  interval_days: number | null; // null = not computed yet
  next_due: string | null; // null when retired
  retired_on: string | null;
  created_at: string;
}

// Mirrors public.attempts: one solve or review. The earliest is the first solve.
export interface Attempt {
  id: string;
  question_id: string;
  attempted_on: string; // YYYY-MM-DD
  minutes: number | null; // null only on migrated rows
  grade: Grade | null; // null only on migrated initial solves
  solution_url: string | null;
  notes: string | null;
  created_at: string;
}

// Mirrors public.schedule_events: manual schedule changes, replayed with attempts.
export interface ScheduleEvent {
  id: string;
  question_id: string;
  kind: "defer" | "unretire";
  event_date: string;
  created_at: string;
}

// Mirrors the public_questions view: the portfolio-safe subset of a question
// shown to anonymous visitors. No confidence, notes, schedule, or user_id.
export type PublicQuestion = Pick<
  Question,
  "id" | "leetcode_number" | "title" | "url" | "difficulty" | "topic" | "solution_url" | "date_solved"
> & { retired: boolean };

// Mirrors the public_attempts view: order, grade, and link. No dates or notes.
export interface PublicAttempt {
  question_id: string;
  seq: number;
  grade: Grade | null;
  solution_url: string | null;
}

// Mirrors public.note_photos: many photos per question.
export interface NotePhoto {
  id: string;
  question_id: string;
  path: string; // storage object path in the note-photos bucket
  created_at: string;
}
