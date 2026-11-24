import ActivityHeatmap from "@/components/ActivityHeatmap";
import AppNav from "@/components/AppNav";
import DayProgressBar from "@/components/DayProgressBar";
import EmptyScene from "@/components/EmptyScene";
import DifficultySplitBar from "@/components/DifficultySplitBar";
import MilestoneWatcher from "@/components/MilestoneWatcher";
import OverallProgress from "@/components/OverallProgress";
import PortfolioHero from "@/components/PortfolioHero";
import StatsRow from "@/components/StatsRow";
import TodayQueue, { type QueueRow } from "@/components/TodayQueue";
import TopicCoverage from "@/components/TopicCoverage";
import WeekLoadStrip from "@/components/WeekLoadStrip";
import { recomputeQuestion } from "@/lib/attempts";
import { computeStreaks, daysUntil, greetingFor, nzHour, todayISO } from "@/lib/dates";
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
import { TOTAL_PROBLEMS, type Attempt, type PublicAttempt, type PublicQuestion, type Question } from "@/lib/types";

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

  const streak = computeStreaks(
    activity.filter((a) => a.total > 0).map((a) => a.day),
    today
  );

  return (
    <>
      <AppNav isOwner />
      <MilestoneWatcher solved={overall.solved} total={overall.total} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <header className="mb-8">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <p className="data text-sm text-muted">
              {new Date(`${today}T12:00:00`).toLocaleDateString("en-NZ", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            <StreakChip current={streak.current} longest={streak.longest} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{greetingFor(nzHour())}, Jack</h1>
          <p className="mt-2 text-muted">
            {dueCount === 0
              ? reviewedToday > 0
                ? "Reviews are done for today. Nice."
                : "No reviews due today, so it's a fresh-problem day."
              : `${dueCount} review${dueCount === 1 ? "" : "s"} waiting, plus something new.`}
          </p>
        </header>

        {error && <p className="mb-8 text-sm text-danger">{error.message}</p>}

        {questions.length > 0 ? (
          <>
            <QuoteCard quote={quote} planDay={planDay} />
            <section className="card mb-8 px-5 py-4">
              <DayProgressBar progress={todayProgress(queue)} today={today} />
            </section>
            <TodayQueue
              queue={queue}
              today={today}
              allProblems={[...questions].sort((a, b) => a.leetcode_number - b.leetcode_number)}
            />

            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              <section className="card px-5 py-5">
                <h2 className="mb-4 font-bold">The 150</h2>
                <OverallProgress progress={overall} />
              </section>
              <section className="card px-5 py-5">
                <h2 className="mb-4 font-bold">Coming up this week</h2>
                <WeekLoadStrip load={load} />
              </section>
            </div>
          </>
        ) : (
          !error && (
            <EmptyScene
              title="Your logbook is ready"
              body="Log a problem you've solved and its first review gets scheduled from how it went."
              action={{ href: "/problems/new", label: "Add your first solve" }}
            />
          )
        )}

        <section className="mt-12">
          <h2 className="mb-4 font-bold">Stats</h2>
          <div className="card px-5 py-5">
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
                <h3 className="mb-3 text-sm font-bold text-muted">Topics</h3>
                <TopicCoverage topics={topics} />
              </div>
            )}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="mb-4 font-bold">Activity</h2>
          <div className="card px-5 py-5">
            <ActivityHeatmap rows={activity} today={today} />
          </div>
        </section>
      </main>
    </>
  );
}

function StreakChip({ current, longest }: { current: number; longest: number }) {
  if (current > 0) {
    return (
      <span className="chip bg-amber-soft text-amber-ink" title={`Longest: ${longest} days`}>
        <span aria-hidden>🔥</span>
        <span className="data">{current}</span>-day streak
      </span>
    );
  }
  if (longest > 0) return <span className="chip bg-raised text-muted">Start a new streak today</span>;
  return null;
}

function QuoteCard({ quote, planDay }: { quote: string; planDay: number | null }) {
  return (
    <section className="relative mb-6 overflow-hidden rounded-3xl bg-brand-soft px-6 py-6 sm:px-8">
      {/* decorative palette shapes, tucked into the corner */}
      <div aria-hidden className="pointer-events-none absolute -top-6 -right-6 flex rotate-12 gap-2 opacity-90">
        <span className="h-16 w-16 rounded-full bg-sun" />
        <span className="mt-8 h-12 w-12 rounded-2xl bg-grape" />
        <span className="mt-2 h-10 w-10 rounded-full bg-sky" />
      </div>
      <p className="relative max-w-[30ch] text-xl font-bold tracking-tight text-balance sm:text-2xl">
        {quote}
      </p>
      <p className="data relative mt-3 text-xs text-brand-ink">
        the Sydney plan{planDay !== null ? ` · day ${planDay}` : ""}
      </p>
    </section>
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
  const retiredCount = questions.filter((q) => q.retired).length;
  const overall = {
    solved: questions.length,
    inReview: questions.length - retiredCount,
    retired: retiredCount,
    total: TOTAL_PROBLEMS,
  };

  return (
    <>
      <AppNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <PortfolioHero />

        {error && <p className="mb-8 text-sm text-danger">{error.message}</p>}

        <section className="card mb-4 px-5 py-5">
          <h2 className="mb-4 font-bold">The 150</h2>
          <OverallProgress progress={overall} />
        </section>

        <section className="mt-12">
          <h2 className="mb-4 font-bold">Progress</h2>
          <div className="card px-5 py-5">
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
                <h3 className="mb-3 text-sm font-bold text-muted">Topics</h3>
                <TopicCoverage topics={topics} />
              </div>
            )}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="mb-4 font-bold">Activity</h2>
          <div className="card px-5 py-5">
            <ActivityHeatmap rows={activity} today={today} />
          </div>
        </section>
      </main>
    </>
  );
}
