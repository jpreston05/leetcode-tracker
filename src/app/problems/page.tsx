import Link from "next/link";
import AppNav from "@/components/AppNav";
import ProblemsList, { type ProblemListRow } from "@/components/ProblemsList";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/dates";
import type { PublicAttempt, PublicQuestion, Question } from "@/lib/types";

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

  // Owner reads the base tables (with schedule); the public view reads the
  // anon-safe views and counts attempts in memory (no schedule columns).
  const source = isOwner
    ? { table: "questions" as const, embed: "*, attempts(count)" }
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
    type OwnerRow = Question & { attempts: { count: number }[] };
    rows = ((data ?? []) as unknown as OwnerRow[]).map((question) => ({
      ...question,
      retired: question.retired_on !== null,
      attempts: question.attempts[0]?.count ?? 0,
    }));
  } else {
    const questions = (data ?? []) as unknown as PublicQuestion[];
    const { data: attempts, error: attemptsError } = await supabase
      .from("public_attempts")
      .select("question_id")
      .overrideTypes<Pick<PublicAttempt, "question_id">[]>();
    listError = listError ?? attemptsError?.message ?? null;
    const counts = new Map<string, number>();
    for (const a of attempts ?? []) counts.set(a.question_id, (counts.get(a.question_id) ?? 0) + 1);
    rows = questions.map((question) => ({ ...question, attempts: counts.get(question.id) ?? 0 }));
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
                Every problem you add gets reviewed until you can solve it cleanly after three weeks away.
              </p>
              <Link href="/problems/new" className="btn-primary">
                Add your first solve
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted">No problems logged yet.</p>
          ))}

        {rows.length > 0 && (
          <ProblemsList rows={rows} today={today} />
        )}
      </main>
    </>
  );
}
