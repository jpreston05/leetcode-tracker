import Link from "next/link";
import ActivityHeatmap from "@/components/ActivityHeatmap";
import AppNav from "@/components/AppNav";
import DifficultySplitBar from "@/components/DifficultySplitBar";
import StatsRow from "@/components/StatsRow";
import TopicCoverage from "@/components/TopicCoverage";
import UpcomingAgenda, { type AgendaRow } from "@/components/UpcomingAgenda";
import WeekLoadStrip from "@/components/WeekLoadStrip";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/checkpoints";
import { QUOTES } from "@/lib/quotes";
import {
  cleanRate,
  difficultySplit,
  graduatedCount,
  maxActivityDay,
  quoteIndexFor,
  topicCoverage,
  weekLoad,
  type DayActivity,
} from "@/lib/stats";
import type { Checkpoint, Question } from "@/lib/types";

type StatCheckpoint = Pick<Checkpoint, "question_id" | "is_catchup" | "status" | "outcome">;

export default async function HomePage() {
  const supabase = await createClient();
  const today = todayISO();

  const [agendaRes, questionsRes, checkpointsRes, activityRes] = await Promise.all([
    supabase
      .from("checkpoints")
      .select("*, questions(id, leetcode_number, title, difficulty, topic)")
      .neq("status", "done")
      .not("due_date", "is", null)
      .order("due_date")
      .overrideTypes<AgendaRow[]>(),
    supabase
      .from("questions")
      .select("id, difficulty, topic")
      .overrideTypes<Pick<Question, "id" | "difficulty" | "topic">[]>(),
    supabase
      .from("checkpoints")
      .select("question_id, is_catchup, status, outcome")
      .overrideTypes<StatCheckpoint[]>(),
    supabase.from("activity_daily").select("*").overrideTypes<DayActivity[]>(),
  ]);

  const error = agendaRes.error ?? questionsRes.error ?? checkpointsRes.error ?? activityRes.error;
  const agenda = agendaRes.data ?? [];
  const questions = questionsRes.data ?? [];
  const checkpoints = checkpointsRes.data ?? [];
  const activity = activityRes.data ?? [];

  const dueCount = agenda.filter((r) => r.due_date! <= today).length;
  const quote = QUOTES[quoteIndexFor(today, QUOTES.length)];
  const split = difficultySplit(questions);
  const topics = topicCoverage(questions);
  const done = checkpoints.filter((c) => c.status === "done");
  const load = weekLoad(agenda, today);
  const record = maxActivityDay(activity);

  return (
    <>
      <AppNav />
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
              ? "All clear tonight"
              : `${dueCount} review${dueCount === 1 ? "" : "s"} due`}
          </h1>
          <p className="mt-2 max-w-[55ch] text-sm text-muted">{quote}</p>
        </div>

        {error && <p className="mb-8 text-sm text-danger">{error.message}</p>}

        {agenda.length > 0 ? (
          <>
            <UpcomingAgenda rows={agenda} today={today} />
            <section className="mt-10">
              <h2 className="mb-4 text-sm font-medium text-muted">This week&apos;s load</h2>
              <WeekLoadStrip load={load} />
            </section>
          </>
        ) : (
          !error && (
            <div className="rounded-xl border border-line px-6 py-10 text-center">
              <p className="mb-1 text-sm font-medium">Nothing scheduled yet</p>
              <p className="mb-5 text-sm text-muted">
                Log a solved problem and its review ladder starts tomorrow.
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
            reviews={done.length}
            cleanRate={cleanRate(done)}
            graduated={graduatedCount(checkpoints)}
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
