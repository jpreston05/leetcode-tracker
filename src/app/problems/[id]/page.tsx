import Link from "next/link";
import { notFound } from "next/navigation";
import AppNav from "@/components/AppNav";
import CheckpointLadder from "@/components/CheckpointLadder";
import LadderRail from "@/components/LadderRail";
import PhotoUpload from "@/components/PhotoUpload";
import { createClient } from "@/lib/supabase/server";
import { formatShort, todayISO } from "@/lib/checkpoints";
import { difficultyClass } from "@/lib/ui";
import type { Checkpoint, Question } from "@/lib/types";

export default async function ProblemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const today = todayISO();

  const [{ data: question }, { data: checkpoints }] = await Promise.all([
    supabase.from("questions").select("*").eq("id", id).maybeSingle<Question>(),
    supabase
      .from("checkpoints")
      .select("*")
      .eq("question_id", id)
      // catch-ups share their rung's sequence; created_at slots them after it
      .order("sequence")
      .order("created_at")
      .overrideTypes<Checkpoint[]>(),
  ]);

  if (!question) notFound();

  // Private bucket: mint a short-lived signed URL per page view.
  let photoUrl: string | null = null;
  if (question.photo_path) {
    const { data } = await supabase.storage
      .from("note-photos")
      .createSignedUrl(question.photo_path, 3600);
    photoUrl = data?.signedUrl ?? null;
  }

  return (
    <>
      <AppNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-10">
          <p className="data mb-1 text-sm text-faint">#{question.leetcode_number}</p>
          <h1 className="mb-3 text-2xl font-semibold tracking-tight text-balance">
            {question.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <span className={difficultyClass[question.difficulty]}>{question.difficulty}</span>
            <span>{question.topic}</span>
            <span>
              confidence <span className="data">{question.confidence}/5</span>
            </span>
            <span>
              solved <span className="data">{formatShort(question.date_solved)}</span>
            </span>
            <a
              href={question.url}
              target="_blank"
              rel="noreferrer"
              className="text-muted underline decoration-line-strong underline-offset-4 transition-colors duration-150 hover:text-ink"
            >
              LeetCode ↗
            </a>
          </div>
        </div>

        <section className="mb-12 rounded-xl border border-line bg-surface p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-sm font-medium text-muted">Review ladder</h2>
            <div className="w-36">
              <LadderRail checkpoints={checkpoints ?? []} today={today} />
            </div>
          </div>
          <CheckpointLadder checkpoints={checkpoints ?? []} />
        </section>

        {question.notes && (
          <section className="mb-12">
            <h2 className="mb-2 text-sm font-medium text-muted">Notes</h2>
            <p className="max-w-[65ch] text-sm whitespace-pre-wrap">{question.notes}</p>
          </section>
        )}

        <section className="mb-12">
          <h2 className="mb-3 text-sm font-medium text-muted">Paper notes</h2>
          {photoUrl && (
            // Plain <img>: signed URLs expire, so Next's image optimizer cache would break.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={`Handwritten notes for ${question.title}`}
              className="mb-3 max-w-full rounded-xl border border-line"
            />
          )}
          <PhotoUpload questionId={question.id} hasPhoto={!!question.photo_path} />
        </section>

        <p className="text-sm">
          <Link
            href="/problems"
            className="text-muted transition-colors duration-150 hover:text-ink"
          >
            ← All problems
          </Link>
        </p>
      </main>
    </>
  );
}
