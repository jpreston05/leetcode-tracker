import Link from "next/link";
import { notFound } from "next/navigation";
import AppNav from "@/components/AppNav";
import { createClient } from "@/lib/supabase/server";
import { INTERVALS_DAYS } from "@/lib/leitner";
import { OUTCOMES, type Question, type Review } from "@/lib/types";

const outcomeLabel = Object.fromEntries(OUTCOMES.map((o) => [o.value, o.label]));

export default async function ProblemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: question }, { data: reviews }] = await Promise.all([
    supabase.from("questions").select("*").eq("id", id).maybeSingle<Question>(),
    supabase
      .from("reviews")
      .select("*")
      .eq("question_id", id)
      .order("created_at", { ascending: false })
      .overrideTypes<Review[]>(),
  ]);

  if (!question) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 p-8">
      <AppNav title={`${question.leetcode_number}. ${question.title}`} />

      <dl className="mb-8 grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
        <Item label="Difficulty">{question.difficulty}</Item>
        <Item label="Topic">{question.topic}</Item>
        <Item label="Confidence">{question.confidence} / 5</Item>
        <Item label="First solved">{question.date_solved}</Item>
        <Item label="Leitner box">
          {question.leitner_box} ({INTERVALS_DAYS[question.leitner_box]}-day interval)
        </Item>
        <Item label="Next review">{question.next_review_date}</Item>
      </dl>

      <p className="mb-8 text-sm">
        <a href={question.url} target="_blank" rel="noreferrer" className="underline">
          Open on LeetCode ↗
        </a>
      </p>

      {question.notes && (
        <section className="mb-8">
          <h2 className="mb-2 text-sm font-semibold text-gray-500">Notes</h2>
          <p className="whitespace-pre-wrap text-sm">{question.notes}</p>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-500">Review history</h2>
        {!reviews?.length && <p className="text-sm text-gray-500">No reviews yet.</p>}
        {!!reviews?.length && (
          <ul className="flex flex-col gap-1 text-sm">
            {reviews.map((r) => (
              <li key={r.id}>
                {r.reviewed_on} — {outcomeLabel[r.outcome]}
                {r.time_taken_minutes ? ` · ${r.time_taken_minutes} min` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-8 text-sm text-gray-500">
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
