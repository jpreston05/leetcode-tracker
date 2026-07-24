import Link from "next/link";
import { notFound } from "next/navigation";
import AppNav from "@/components/AppNav";
import CheckpointLadder from "@/components/CheckpointLadder";
import LadderRail from "@/components/LadderRail";
import PhotoRemoveButton from "@/components/PhotoRemoveButton";
import PhotoUpload from "@/components/PhotoUpload";
import { createClient } from "@/lib/supabase/server";
import { formatShort, todayISO } from "@/lib/checkpoints";
import { difficultyClass } from "@/lib/ui";
import type { Checkpoint, NotePhoto, Question } from "@/lib/types";

export default async function ProblemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const today = todayISO();

  const [{ data: question }, { data: checkpoints }, { data: photos }] = await Promise.all([
    supabase.from("questions").select("*").eq("id", id).maybeSingle<Question>(),
    supabase
      .from("checkpoints")
      .select("*")
      .eq("question_id", id)
      // catch-ups share their rung's sequence; created_at slots them after it
      .order("sequence")
      .order("created_at")
      .overrideTypes<Checkpoint[]>(),
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
            {question.solution_url && (
              <a
                href={question.solution_url}
                target="_blank"
                rel="noreferrer"
                className="text-muted underline decoration-line-strong underline-offset-4 transition-colors duration-150 hover:text-ink"
              >
                GitHub ↗
              </a>
            )}
            <Link
              href={`/problems/${question.id}/edit`}
              className="text-muted underline decoration-line-strong underline-offset-4 transition-colors duration-150 hover:text-ink"
            >
              Edit
            </Link>
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
                      className="max-w-full rounded-xl border border-line"
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
