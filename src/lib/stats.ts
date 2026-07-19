import { addDaysISO } from "./checkpoints";
import type { Checkpoint, Difficulty, Question } from "./types";

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
  done: Pick<Checkpoint, "question_id" | "outcome">[]
): TopicRow[] {
  const topicById = new Map(questions.map((q) => [q.id, normalizeTopic(q.topic)]));
  const quality = new Map<string, { reviews: number; clean: number }>();
  for (const d of done) {
    const topic = topicById.get(d.question_id);
    if (!topic) continue;
    const entry = quality.get(topic) ?? { reviews: 0, clean: 0 };
    entry.reviews++;
    if (d.outcome === "clean") entry.clean++;
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

/** % of completed reviews that were clean; null when nothing is completed. */
export function cleanRate(done: Pick<Checkpoint, "outcome">[]): number | null {
  if (done.length === 0) return null;
  const clean = done.filter((c) => c.outcome === "clean").length;
  return Math.round((clean / done.length) * 100);
}

/** Questions whose entire non-catchup ladder is done. */
export function graduatedCount(
  checkpoints: Pick<Checkpoint, "question_id" | "is_catchup" | "status">[]
): number {
  const perQuestion = new Map<string, { rungs: number; done: number }>();
  for (const cp of checkpoints) {
    if (cp.is_catchup) continue;
    const entry = perQuestion.get(cp.question_id) ?? { rungs: 0, done: 0 };
    entry.rungs++;
    if (cp.status === "done") entry.done++;
    perQuestion.set(cp.question_id, entry);
  }
  let graduated = 0;
  for (const { rungs, done } of perQuestion.values()) {
    if (rungs > 0 && rungs === done) graduated++;
  }
  return graduated;
}

/** Review count for each of the next 7 days; overdue folds into today. */
export function weekLoad(
  pending: Pick<Checkpoint, "due_date">[],
  today: string
): { date: string; count: number }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDaysISO(today, i);
    const count = pending.filter((p) =>
      i === 0 ? p.due_date !== null && p.due_date <= today : p.due_date === date
    ).length;
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
