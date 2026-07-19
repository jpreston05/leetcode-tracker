import Link from "next/link";
import AppNav from "@/components/AppNav";
import LadderRail from "@/components/LadderRail";
import { createClient } from "@/lib/supabase/server";
import { formatShort, todayISO } from "@/lib/checkpoints";
import { difficultyClass } from "@/lib/ui";
import type { Checkpoint, Question } from "@/lib/types";

type Row = Question & {
  checkpoints: Pick<
    Checkpoint,
    "sequence" | "interval_label" | "due_date" | "status" | "is_catchup"
  >[];
};

export default async function ProblemsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; topic?: string }>;
}) {
  const { q, topic } = await searchParams;
  const supabase = await createClient();
  const today = todayISO();

  let query = supabase
    .from("questions")
    .select("*, checkpoints(sequence, interval_label, due_date, status, is_catchup)")
    .order("leetcode_number");

  if (topic) query = query.ilike("topic", topic.trim());
  if (q?.trim()) {
    // strip PostgREST or-syntax delimiters; a number searches the problem number
    const safe = q.replace(/[,%()]/g, " ").trim();
    query = /^\d+$/.test(safe)
      ? query.eq("leetcode_number", Number(safe))
      : query.or(`title.ilike.%${safe}%,topic.ilike.%${safe}%`);
  }

  const { data: questions, error } = await query.overrideTypes<Row[]>();
  const filtered = Boolean(q?.trim() || topic);

  return (
    <>
      <AppNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-baseline gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Problems</h1>
          {!!questions?.length && (
            <span className="data text-sm text-faint">{questions.length}</span>
          )}
        </div>

        <form action="/problems" className="mb-6 flex flex-wrap items-center gap-3">
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search title, topic, or number…"
            className="field max-w-xs"
            aria-label="Search problems"
          />
          {topic && (
            <>
              <input type="hidden" name="topic" value={topic} />
              <span className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pr-2 pl-3 text-xs">
                <span className="text-muted">topic:</span> {topic}
                <Link
                  href={q?.trim() ? `/problems?q=${encodeURIComponent(q)}` : "/problems"}
                  aria-label={`Clear topic filter ${topic}`}
                  className="flex h-4 w-4 items-center justify-center rounded-full text-muted hover:bg-raised hover:text-ink"
                >
                  ×
                </Link>
              </span>
            </>
          )}
        </form>

        {error && <p className="text-sm text-danger">{error.message}</p>}

        {questions?.length === 0 &&
          (filtered ? (
            <p className="text-sm text-muted">
              No matches.{" "}
              <Link href="/problems" className="underline">
                Clear filters.
              </Link>
            </p>
          ) : (
            <div className="rounded-xl border border-line px-6 py-10 text-center">
              <p className="mb-1 text-sm font-medium">The logbook is empty</p>
              <p className="mb-5 text-sm text-muted">
                Every problem you add climbs a 7-rung review ladder from 1 day to 6 months.
              </p>
              <Link href="/problems/new" className="btn-primary">
                Add your first solve
              </Link>
            </div>
          ))}

        {!!questions?.length && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-faint">
                  <th className="py-2 pr-4 font-medium">Problem</th>
                  <th className="py-2 pr-4 font-medium">Topic</th>
                  <th className="w-32 py-2 pr-4 font-medium">Ladder</th>
                  <th className="py-2 text-right font-medium">Next</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <ProblemRow key={q.id} q={q} today={today} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}

function ProblemRow({ q, today }: { q: Row; today: string }) {
  const pending = q.checkpoints.find((c) => c.status !== "done" && c.due_date !== null);
  const graduated = !pending && q.checkpoints.length > 0;

  return (
    <tr className="group border-b border-line/60 transition-colors duration-150 hover:bg-surface">
      <td className="py-3 pr-4">
        <Link href={`/problems/${q.id}`} className="flex items-baseline gap-2">
          <span className="data text-faint">{q.leetcode_number}</span>
          <span className="font-medium group-hover:text-ink">{q.title}</span>
          <span className={`text-xs ${difficultyClass[q.difficulty]}`}>{q.difficulty}</span>
        </Link>
      </td>
      <td className="py-3 pr-4 text-muted">{q.topic}</td>
      <td className="py-3 pr-4">
        <LadderRail checkpoints={q.checkpoints} today={today} />
      </td>
      <td className="data py-3 text-right text-xs">
        {graduated ? (
          <span className="text-olive">graduated</span>
        ) : pending ? (
          <span
            className={
              pending.due_date! <= today
                ? pending.due_date! < today
                  ? "text-danger"
                  : "text-olive"
                : "text-muted"
            }
          >
            {pending.due_date! <= today ? "due" : formatShort(pending.due_date!)}
          </span>
        ) : (
          <span className="text-faint">—</span>
        )}
      </td>
    </tr>
  );
}
