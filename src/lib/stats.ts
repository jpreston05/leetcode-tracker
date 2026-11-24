import { addDaysISO } from "./dates";
import { TOTAL_PROBLEMS, type Difficulty, type Grade, type Question } from "./types";

/** A graded review: any attempt after the first solve. */
export type Review = { question_id: string; grade: Grade | null };

/** Drops each question's first attempt (the solve), leaving its reviews. */
export function reviewsOf<A extends Review & { attempted_on: string; created_at: string }>(
  attempts: A[]
): A[] {
  const first = new Map<string, A>();
  for (const a of attempts) {
    const current = first.get(a.question_id);
    if (
      !current ||
      a.attempted_on < current.attempted_on ||
      (a.attempted_on === current.attempted_on && a.created_at < current.created_at)
    ) {
      first.set(a.question_id, a);
    }
  }
  const solves = new Set(first.values());
  return attempts.filter((a) => !solves.has(a));
}

// Row shape of the activity_daily view.
export interface DayActivity {
  day: string;
  solved: number;
  reviewed: number;
  total: number;
}

export interface DifficultySplit {
  counts: Record<Difficulty, number>;
  pct: Record<Difficulty, number>;
  total: number;
}

export function difficultySplit(questions: Pick<Question, "difficulty">[]): DifficultySplit {
  const counts: Record<Difficulty, number> = { Easy: 0, Medium: 0, Hard: 0 };
  for (const q of questions) counts[q.difficulty]++;
  const total = questions.length;
  const pct = (n: number) => (total === 0 ? 0 : (n / total) * 100);
  return {
    counts,
    total,
    pct: { Easy: pct(counts.Easy), Medium: pct(counts.Medium), Hard: pct(counts.Hard) },
  };
}

const normalizeTopic = (topic: string) => topic.trim().toLowerCase();

/** Topics ranked by count (case/whitespace-normalized), desc then alpha. */
export function topicCoverage(questions: Pick<Question, "topic">[]): { topic: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const q of questions) {
    const topic = normalizeTopic(q.topic);
    if (!topic) continue;
    counts.set(topic, (counts.get(topic) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic));
}

export interface TopicRow {
  topic: string;
  count: number;
  reviews: number;
  cleanPct: number | null; // null until the topic has a completed review
}

/** topicCoverage + per-topic review quality: which topics you log vs which you fail. */
export function topicCoverageWithQuality(
  questions: Pick<Question, "id" | "topic">[],
  reviews: Review[]
): TopicRow[] {
  const topicById = new Map(questions.map((q) => [q.id, normalizeTopic(q.topic)]));
  const quality = new Map<string, { reviews: number; clean: number }>();
  for (const r of reviews) {
    const topic = topicById.get(r.question_id);
    if (!topic) continue;
    const entry = quality.get(topic) ?? { reviews: 0, clean: 0 };
    entry.reviews++;
    if (r.grade === "clean") entry.clean++;
    quality.set(topic, entry);
  }
  return topicCoverage(questions).map((row) => {
    const entry = quality.get(row.topic);
    return {
      ...row,
      reviews: entry?.reviews ?? 0,
      cleanPct: entry ? Math.round((entry.clean / entry.reviews) * 100) : null,
    };
  });
}

/** % of reviews graded clean; null when there are none. */
export function cleanRate(reviews: Pick<Review, "grade">[]): number | null {
  if (reviews.length === 0) return null;
  const clean = reviews.filter((r) => r.grade === "clean").length;
  return Math.round((clean / reviews.length) * 100);
}

export interface Progress {
  solved: number;
  inReview: number;
  retired: number;
  total: number;
}

/** X/150 solved, of which Y are still in review and Z have retired. */
export function progress(questions: Pick<Question, "retired_on">[]): Progress {
  const retired = questions.filter((q) => q.retired_on !== null).length;
  return {
    solved: questions.length,
    inReview: questions.length - retired,
    retired,
    total: TOTAL_PROBLEMS,
  };
}

/** Reviews due on each of the next 7 days; overdue folds into today. */
export function weekLoad(
  questions: Pick<Question, "next_due" | "retired_on">[],
  today: string
): { date: string; count: number }[] {
  const active = questions.filter((q) => q.retired_on === null && q.next_due !== null);
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDaysISO(today, i);
    const count = active.filter((q) => (i === 0 ? q.next_due! <= today : q.next_due === date)).length;
    return { date, count };
  });
}

/** Personal record day; latest wins a tie. Null when there is no activity. */
export function maxActivityDay(rows: DayActivity[]): DayActivity | null {
  let best: DayActivity | null = null;
  for (const row of rows) {
    if (row.total > 0 && (best === null || row.total >= best.total)) best = row;
  }
  return best;
}

/** Deterministic date-seeded index: same quote all day, new one tomorrow. */
export function quoteIndexFor(today: string, count: number): number {
  let hash = 0;
  for (const ch of today) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return count === 0 ? 0 : hash % count;
}
