import Link from "next/link";
import AppNav from "@/components/AppNav";
import ProblemsList, { type ProblemListRow } from "@/components/ProblemsList";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/checkpoints";
import type { PublicCheckpoint, PublicQuestion } from "@/lib/types";

export default async function ProblemsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; topic?: string }>;
}) {
  const { q, topic } = await searchParams;
  const supabase = await createClient();
  const today = todayISO();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = !!user;

  // Owner reads the base tables (full ladder + schedule); the public view reads
  // the anon-safe views and joins checkpoints in memory (no schedule columns).
  const source = isOwner
    ? { table: "questions" as const, embed: "*, checkpoints(sequence, interval_label, due_date, status, is_catchup)" }
    : { table: "public_questions" as const, embed: "*" };

  let query = supabase.from(source.table).select(source.embed).order("leetcode_number");

  if (topic) query = query.ilike("topic", topic.trim());
  if (q?.trim()) {
    // strip PostgREST or-syntax delimiters; a number searches the problem number
    const safe = q.replace(/[,%()]/g, " ").trim();
    query = /^\d+$/.test(safe)
      ? query.eq("leetcode_number", Number(safe))
      : query.or(`title.ilike.%${safe}%,topic.ilike.%${safe}%`);
  }

  const { data, error } = await query;
  const filtered = Boolean(q?.trim() || topic);

  let rows: ProblemListRow[];
  let listError = error?.message ?? null;

  if (isOwner) {
    rows = (data ?? []) as unknown as ProblemListRow[];
  } else {
    // Attach each question's checkpoints from the separate public view.
    const questions = (data ?? []) as unknown as PublicQuestion[];
    const { data: cps, error: cpError } = await supabase
      .from("public_checkpoints")
      .select("*")
      .overrideTypes<PublicCheckpoint[]>();
    listError = listError ?? cpError?.message ?? null;
    const byQuestion = new Map<string, PublicCheckpoint[]>();
    for (const cp of cps ?? []) {
      const list = byQuestion.get(cp.question_id) ?? [];
      list.push(cp);
      byQuestion.set(cp.question_id, list);
    }
    rows = questions.map((question) => ({
      ...question,
      checkpoints: byQuestion.get(question.id) ?? [],
    }));
  }

  return (
    <>
      <AppNav isOwner={isOwner} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-baseline gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Problems</h1>
          {rows.length > 0 && <span className="data text-sm text-faint">{rows.length}</span>}
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

        {listError && <p className="text-sm text-danger">{listError}</p>}

        {rows.length === 0 &&
          !listError &&
          (filtered ? (
            <p className="text-sm text-muted">
              No matches.{" "}
              <Link href="/problems" className="underline">
                Clear filters.
              </Link>
            </p>
          ) : isOwner ? (
            <div className="rounded-xl border border-line px-6 py-10 text-center">
              <p className="mb-1 text-sm font-medium">The logbook is empty</p>
              <p className="mb-5 text-sm text-muted">
                Every problem you add climbs a 7-rung review ladder from 1 day to 6 months.
              </p>
              <Link href="/problems/new" className="btn-primary">
                Add your first solve
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted">No problems logged yet.</p>
          ))}

        {rows.length > 0 && (
          <ProblemsList rows={rows} today={today} hideSchedule={!isOwner} />
        )}
      </main>
    </>
  );
}
