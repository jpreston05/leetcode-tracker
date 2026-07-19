import Link from "next/link";
import { notFound } from "next/navigation";
import AppNav from "@/components/AppNav";
import CheckpointLadder from "@/components/CheckpointLadder";
import PhotoUpload from "@/components/PhotoUpload";
import { createClient } from "@/lib/supabase/server";
import type { Checkpoint, Question } from "@/lib/types";

export default async function ProblemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

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
    <main className="mx-auto w-full max-w-2xl flex-1 p-8">
      <AppNav title={`${question.leetcode_number}. ${question.title}`} />

      <dl className="mb-8 grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-4">
        <Item label="Difficulty">{question.difficulty}</Item>
        <Item label="Topic">{question.topic}</Item>
        <Item label="Confidence">{question.confidence} / 5</Item>
        <Item label="First solved">{question.date_solved}</Item>
      </dl>

      <p className="mb-8 text-sm">
        <a href={question.url} target="_blank" rel="noreferrer" className="underline">
          Open on LeetCode ↗
        </a>
      </p>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-gray-500">Review ladder</h2>
        <CheckpointLadder checkpoints={checkpoints ?? []} />
      </section>

      {question.notes && (
        <section className="mb-8">
          <h2 className="mb-2 text-sm font-semibold text-gray-500">Notes</h2>
          <p className="whitespace-pre-wrap text-sm">{question.notes}</p>
        </section>
      )}

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold text-gray-500">Paper notes</h2>
        {photoUrl && (
          // Plain <img>: signed URLs expire, so Next's image optimizer cache would break.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={`Handwritten notes for ${question.title}`}
            className="mb-2 max-w-full rounded-lg border border-gray-200 dark:border-gray-800"
          />
        )}
        <PhotoUpload questionId={question.id} hasPhoto={!!question.photo_path} />
      </section>

      <p className="text-sm text-gray-500">
        <Link href="/problems" className="hover:underline">
          ← All problems
        </Link>
      </p>
    </main>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
