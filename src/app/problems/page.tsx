import Link from "next/link";
import AppNav from "@/components/AppNav";
import ProblemsList, { type ProblemListRow } from "@/components/ProblemsList";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/checkpoints";

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

  const { data: questions, error } = await query.overrideTypes<ProblemListRow[]>();
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

        {!!questions?.length && <ProblemsList rows={questions} today={today} />}
      </main>
    </>
  );
}
