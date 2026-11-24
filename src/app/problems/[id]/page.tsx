import Link from "next/link";
import { notFound } from "next/navigation";
import AppNav from "@/components/AppNav";
import AttemptHistory from "@/components/AttemptHistory";
import PhotoRemoveButton from "@/components/PhotoRemoveButton";
import PhotoUpload from "@/components/PhotoUpload";
import ScheduleEventButton from "@/components/ScheduleEventButton";
import { createClient } from "@/lib/supabase/server";
import { daysUntil, formatShort, todayISO } from "@/lib/dates";
import { difficultyChip, gradeChip, statusChip } from "@/lib/ui";
import { GRADES, type Attempt, type NotePhoto, type PublicAttempt, type PublicQuestion, type Question } from "@/lib/types";

const linkClass =
  "font-semibold text-brand-ink underline decoration-brand/40 underline-offset-4 transition-colors duration-150 hover:decoration-brand-ink";

export default async function ProblemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <PublicDetail id={id} />;

  const today = todayISO();

  const [{ data: question }, { data: attempts }, { data: photos }] = await Promise.all([
    supabase.from("questions").select("*").eq("id", id).maybeSingle<Question>(),
    supabase
      .from("attempts")
      .select("*")
      .eq("question_id", id)
      .order("attempted_on")
      .order("created_at")
      .overrideTypes<Attempt[]>(),
    supabase
      .from("note_photos")
      .select("*")
      .eq("question_id", id)
      .order("created_at")
      .overrideTypes<NotePhoto[]>(),
  ]);

  if (!question) notFound();

  // Private bucket: mint short-lived signed URLs per page view.
  const signed = photos?.length
    ? (await supabase.storage.from("note-photos").createSignedUrls(
        photos.map((p) => p.path),
        3600
      )).data
    : [];
  const gallery = (photos ?? []).map((p, i) => ({ ...p, url: signed?.[i]?.signedUrl ?? null }));

  return (
    <>
      <AppNav isOwner />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-8">
          <p className="data mb-1 text-sm text-muted">#{question.leetcode_number}</p>
          <h1 className="mb-3 text-3xl font-extrabold tracking-tight">{question.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
            <span className={difficultyChip[question.difficulty]}>{question.difficulty}</span>
            <span>{question.topic}</span>
            <span>
              confidence <span className="data">{question.confidence}/5</span>
            </span>
            <span>
              solved <span className="data">{formatShort(question.date_solved)}</span>
            </span>
            <a href={question.url} target="_blank" rel="noreferrer" className={linkClass}>
              LeetCode ↗
            </a>
            {question.solution_url && (
              <a href={question.solution_url} target="_blank" rel="noreferrer" className={linkClass}>
                GitHub ↗
              </a>
            )}
            <Link href={`/problems/${question.id}/edit`} className={linkClass}>
              Edit
            </Link>
          </div>
        </div>

        <section className="card mb-10 p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <StatusLine question={question} today={today} />
            {question.retired_on ? (
              <ScheduleEventButton questionId={question.id} kind="unretire" />
            ) : (
              question.next_due !== null &&
              question.next_due <= today && <ScheduleEventButton questionId={question.id} kind="defer" />
            )}
          </div>
          <h2 className="mb-2 font-bold">Attempts</h2>
          <AttemptHistory questionId={question.id} title={question.title} attempts={attempts ?? []} />
        </section>

        {question.notes && (
          <section className="mb-10 rounded-2xl bg-sun-soft p-5">
            <h2 className="mb-2 font-bold">Notes</h2>
            <p className="max-w-[65ch] text-sm whitespace-pre-wrap">{question.notes}</p>
          </section>
        )}

        <section className="mb-12">
          <h2 className="mb-3 font-bold">Paper notes</h2>
          {gallery.length > 0 && (
            <div className="mb-4 flex flex-col gap-4">
              {gallery.map((photo, i) =>
                photo.url === null ? null : (
                  <figure key={photo.id}>
                    {/* Plain <img>: signed URLs expire, so Next's image optimizer cache would break. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={`Handwritten notes for ${question.title}, page ${i + 1}`}
                      loading={i === 0 ? undefined : "lazy"}
                      className="max-w-full rounded-2xl border border-line shadow-soft"
                    />
                    <figcaption className="mt-1.5 flex items-center justify-between">
                      <span className="data text-xs text-faint">
                        page {i + 1} · {formatShort(photo.created_at.slice(0, 10))}
                      </span>
                      <PhotoRemoveButton photoId={photo.id} path={photo.path} />
                    </figcaption>
                  </figure>
                )
              )}
            </div>
          )}
          <PhotoUpload questionId={question.id} />
        </section>

        <p className="text-sm">
          <Link href="/problems" className="text-muted transition-colors duration-150 hover:text-ink">
            ← All problems
          </Link>
        </p>
      </main>
    </>
  );
}

// Read-only detail for the public portfolio: header, status, and the grade of
// each attempt with its solve link. No confidence, notes, photos, dates, or schedule.
async function PublicDetail({ id }: { id: string }) {
  const supabase = await createClient();

  const [{ data: question }, { data: attempts }] = await Promise.all([
    supabase
      .from("public_questions")
      .select("*")
      .eq("id", id)
      .maybeSingle<PublicQuestion>(),
    supabase
      .from("public_attempts")
      .select("*")
      .eq("question_id", id)
      .order("seq")
      .overrideTypes<PublicAttempt[]>(),
  ]);

  if (!question) notFound();

  return (
    <>
      <AppNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-10">
          <p className="data mb-1 text-sm text-muted">#{question.leetcode_number}</p>
          <h1 className="mb-3 text-3xl font-extrabold tracking-tight">{question.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
            <span className={difficultyChip[question.difficulty]}>{question.difficulty}</span>
            <span>{question.topic}</span>
            <span>
              solved <span className="data">{formatShort(question.date_solved)}</span>
            </span>
            <a href={question.url} target="_blank" rel="noreferrer" className={linkClass}>
              LeetCode ↗
            </a>
            {question.solution_url && (
              <a href={question.solution_url} target="_blank" rel="noreferrer" className={linkClass}>
                GitHub ↗
              </a>
            )}
          </div>
        </div>

        <section className="card mb-12 p-5 sm:p-6">
          <p className="mb-4 flex items-center gap-3 text-sm">
            <span className={question.retired ? statusChip.retired : statusChip.review}>
              {question.retired ? "🎓 Retired" : "In review"}
            </span>
            <span className="data text-muted">
              {(attempts ?? []).length} attempt{(attempts ?? []).length === 1 ? "" : "s"}
            </span>
          </p>
          <ol className="flex flex-col">
            {(attempts ?? []).map((a) => (
              <li key={a.seq} className="flex items-center gap-3 border-b border-line py-2.5 text-sm last:border-b-0">
                <span className="w-20 text-xs text-muted">{a.seq === 1 ? "first solve" : `review ${a.seq - 1}`}</span>
                {a.grade ? (
                  <span className={gradeChip[a.grade]}>{GRADES.find((g) => g.value === a.grade)!.label}</span>
                ) : (
                  <span className="chip bg-sun-soft text-sun-ink">solved</span>
                )}
                {a.solution_url && (
                  <a href={a.solution_url} target="_blank" rel="noreferrer" className={`text-xs ${linkClass}`}>
                    GitHub ↗
                  </a>
                )}
              </li>
            ))}
          </ol>
        </section>

        <p className="text-sm">
          <Link href="/problems" className="text-muted transition-colors duration-150 hover:text-ink">
            ← All problems
          </Link>
        </p>
      </main>
    </>
  );
}

function StatusLine({ question, today }: { question: Question; today: string }) {
  if (question.retired_on) {
    return (
      <p className="flex flex-wrap items-center gap-3 text-sm">
        <span className={`${statusChip.retired} text-sm`}>🎓 Retired</span>
        <span className="text-muted">
          on <span className="data">{formatShort(question.retired_on)}</span>. It&apos;s out of the queue for good.
        </span>
      </p>
    );
  }
  if (question.next_due === null) {
    return <p className="text-sm text-muted">Scheduling…</p>;
  }
  const d = daysUntil(question.next_due, today);
  return (
    <p className="flex flex-wrap items-center gap-3 text-sm">
      <span className={`${statusChip.review} text-sm`}>In review</span>
      <span className="text-muted">
        next due <span className="data font-semibold text-ink">{formatShort(question.next_due)}</span>
        {d < 0 && <span className={`data ml-2 ${statusChip.overdue}`}>{-d}d late</span>}
        {d === 0 && <span className={`ml-2 ${statusChip.dueToday}`}>today</span>}
        {question.interval_days !== null && (
          <span className="data ml-2 text-faint">· {question.interval_days}-day gap</span>
        )}
      </span>
    </p>
  );
}
