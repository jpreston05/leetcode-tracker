import Link from "next/link";
import AppNav from "@/components/AppNav";
import ReviewDialog from "@/components/ReviewDialog";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/leitner";
import type { Question } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: due, error } = await supabase
    .from("questions")
    .select("*")
    .lte("next_review_date", todayISO())
    .order("next_review_date")
    .overrideTypes<Question[]>();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 p-8">
      <AppNav title="Due today" />

      {error && <p className="text-sm text-red-600">{error.message}</p>}

      {due?.length === 0 && (
        <p className="text-sm text-gray-500">
          Nothing due. Solve something new and{" "}
          <Link href="/problems/new" className="underline">
            add it
          </Link>
          .
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {due?.map((q) => (
          <li
            key={q.id}
            className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-800"
          >
            <div className="flex items-baseline justify-between gap-4">
              <Link href={`/problems/${q.id}`} className="font-medium hover:underline">
                {q.leetcode_number}. {q.title}
              </Link>
              <span className="shrink-0 text-xs text-gray-500">
                box {q.leitner_box} · due {q.next_review_date}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{q.difficulty}</span>
              <span>{q.topic}</span>
              <a href={q.url} target="_blank" rel="noreferrer" className="underline">
                LeetCode ↗
              </a>
            </div>
            <ReviewDialog questionId={q.id} currentBox={q.leitner_box} />
          </li>
        ))}
      </ul>
    </main>
  );
}
