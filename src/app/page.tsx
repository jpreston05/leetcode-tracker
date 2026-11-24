import Link from "next/link";
import ActivityHeatmap from "@/components/ActivityHeatmap";
import AppNav from "@/components/AppNav";
import DayProgressBar from "@/components/DayProgressBar";
import DifficultySplitBar from "@/components/DifficultySplitBar";
import PortfolioHero from "@/components/PortfolioHero";
import StatsRow from "@/components/StatsRow";
import TodayQueue, { type QueueRow } from "@/components/TodayQueue";
import TopicCoverage from "@/components/TopicCoverage";
import WeekLoadStrip from "@/components/WeekLoadStrip";
import { recomputeQuestion } from "@/lib/attempts";
import { daysUntil, todayISO } from "@/lib/dates";
import { buildTodayQueue, todayProgress } from "@/lib/queue";
import { QUOTES } from "@/lib/quotes";
import {
  cleanRate,
  difficultySplit,
  maxActivityDay,
  progress,
  quoteIndexFor,
  reviewsOf,
  topicCoverageWithQuality,
  weekLoad,
  type DayActivity,
} from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";
import type { Attempt, PublicAttempt, PublicQuestion, Question } from "@/lib/types";

type DashboardQuestion = QueueRow & Pick<Question, "date_solved">;
type StatAttempt = Pick<Attempt, "question_id" | "grade" | "attempted_on" | "created_at">;

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Recruiters (and anyone else) land on the read-only portfolio; only the
  // owner sees the operational dashboard.
  if (!user) return <PublicHome />;

  const today = todayISO();

  // Self-heal: schedule any question whose cache was never computed (rows
  // migrated by v7, or a write that failed between insert and recompute).
  const { data: unscheduled } = await supabase.from("questions").select("id").is("interval_days", null);
  for (const { id } of unscheduled ?? []) await recomputeQuestion(supabase, id);

  const [questionsRes, attemptsRes, activityRes] = await Promise.all([
    supabase
      .from("questions")
      .select("id, leetcode_number, title, difficulty, topic, date_solved, next_due, retired_on, interval_days")
      .overrideTypes<DashboardQuestion[]>(),
    supabase
      .from("attempts")
      .select("question_id, grade, attempted_on, created_at")
      .overrideTypes<StatAttempt[]>(),
    supabase.from("activity_daily").select("*").overrideTypes<DayActivity[]>(),
  ]);

  const error = questionsRes.error ?? attemptsRes.error ?? activityRes.error;
  const questions = questionsRes.data ?? [];
  const reviews = reviewsOf(attemptsRes.data ?? []);
  const activity = activityRes.data ?? [];

  const solvedToday = questions.filter((q) => q.date_solved === today).length;
  const reviewedToday = new Set(reviews.filter((r) => r.attempted_on === today).map((r) => r.question_id)).size;
  const queue = buildTodayQueue(questions, today, solvedToday, reviewedToday);
  const dueCount = queue.due.length;
  const overall = progress(questions);
  const quote = QUOTES[quoteIndexFor(today, QUOTES.length)];
  // "Day N" of the plan, counted from the earliest logged solve.
  const firstSolve = questions.reduce<string | null>(
    (min, q) => (min === null || q.date_solved < min ? q.date_solved : min),
    null
  );
  const planDay = firstSolve ? daysUntil(today, firstSolve) + 1 : null;
  const split = difficultySplit(questions);
  const topics = topicCoverageWithQuality(questions, reviews);
  const load = weekLoad(questions, today);
  const record = maxActivityDay(activity);

  return (
    <>
      <AppNav isOwner />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-10">
          <p className="data mb-1 text-sm text-faint">
            {new Date(`${today}T12:00:00`).toLocaleDateString("en-NZ", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            {dueCount === 0
              ? reviewedToday > 0
                ? "Today's reviews are done"
                : "No reviews due today"
              : `${dueCount} review${dueCount === 1 ? "" : "s"} due`}
          </h1>
          <p className="data mt-2 text-sm text-muted">
            {overall.solved}/{overall.total} solved · {overall.inReview} in review · {overall.retired} retired
          </p>
        </div>

        <section className="mb-10 rounded-xl border border-line bg-surface px-6 py-5">
          <p className="max-w-[40ch] text-lg font-medium tracking-tight text-balance">{quote}</p>
          <p className="data mt-3 text-xs text-faint">
            the Sydney plan{planDay !== null ? ` · day ${planDay}` : ""}
          </p>
        </section>

        {error && <p className="mb-8 text-sm text-danger">{error.message}</p>}

        {questions.length > 0 ? (
          <>
            <div className="mb-6">
              <DayProgressBar progress={todayProgress(queue)} />
            </div>
            <TodayQueue queue={queue} today={today} />
            <section className="mt-10">
              <h2 className="mb-4 text-sm font-medium text-muted">This week&apos;s load</h2>
              <WeekLoadStrip load={load} />
            </section>
          </>
        ) : (
          !error && (
            <div className="rounded-xl border border-line px-6 py-10 text-center">
              <p className="mb-1 text-sm font-medium">Nothing logged yet</p>
              <p className="mb-5 text-sm text-muted">
                Log a solved problem and its first review is scheduled from how it went.
              </p>
              <Link href="/problems/new" className="btn-primary">
                Add your first solve
              </Link>
            </div>
          )
        )}

        <section className="mt-14">
          <h2 className="mb-4 text-sm font-medium text-muted">Stats</h2>
          <StatsRow
            mostInDay={record?.total ?? null}
            problems={questions.length}
            reviews={reviews.length}
            cleanRate={cleanRate(reviews)}
            retired={overall.retired}
          />
          {split.total > 0 && (
            <div className="mt-8">
              <DifficultySplitBar split={split} />
            </div>
          )}
          {topics.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-3 text-xs text-faint">Topics</h3>
              <TopicCoverage topics={topics} />
            </div>
          )}
        </section>

        <section className="mt-14">
          <h2 className="mb-4 text-sm font-medium text-muted">Activity</h2>
          <ActivityHeatmap rows={activity} today={today} />
        </section>
      </main>
    </>
  );
}

// Public portfolio home: progress + coverage + activity, drawn from the
// anon-readable public_* views. No quote, no queue, no schedule.
async function PublicHome() {
  const supabase = await createClient();
  const today = todayISO();

  const [questionsRes, attemptsRes, activityRes] = await Promise.all([
    supabase
      .from("public_questions")
      .select("id, difficulty, topic, retired")
      .overrideTypes<Pick<PublicQuestion, "id" | "difficulty" | "topic" | "retired">[]>(),
    supabase
      .from("public_attempts")
      .select("question_id, seq, grade")
      .overrideTypes<Pick<PublicAttempt, "question_id" | "seq" | "grade">[]>(),
    supabase.from("public_activity").select("*").overrideTypes<DayActivity[]>(),
  ]);

  const error = questionsRes.error ?? attemptsRes.error ?? activityRes.error;
  const questions = questionsRes.data ?? [];
  const reviews = (attemptsRes.data ?? []).filter((a) => a.seq > 1);
  const activity = activityRes.data ?? [];

  const split = difficultySplit(questions);
  const topics = topicCoverageWithQuality(questions, reviews);
  const record = maxActivityDay(activity);

  return (
    <>
      <AppNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <PortfolioHero />

        {error && <p className="mb-8 text-sm text-danger">{error.message}</p>}

        <section className="mt-4">
          <h2 className="mb-4 text-sm font-medium text-muted">Progress</h2>
          <StatsRow
            mostInDay={record?.total ?? null}
            problems={questions.length}
            reviews={reviews.length}
            cleanRate={cleanRate(reviews)}
            retired={questions.filter((q) => q.retired).length}
          />
          {split.total > 0 && (
            <div className="mt-8">
              <DifficultySplitBar split={split} />
            </div>
          )}
          {topics.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-3 text-xs text-faint">Topics</h3>
              <TopicCoverage topics={topics} />
            </div>
          )}
        </section>

        <section className="mt-14">
          <h2 className="mb-4 text-sm font-medium text-muted">Activity</h2>
          <ActivityHeatmap rows={activity} today={today} />
        </section>
      </main>
    </>
  );
}
