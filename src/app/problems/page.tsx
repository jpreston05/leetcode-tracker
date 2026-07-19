import Link from "next/link";
import AppNav from "@/components/AppNav";
import { createClient } from "@/lib/supabase/server";
import { formatShort } from "@/lib/checkpoints";
import type { Checkpoint, Question } from "@/lib/types";

type Row = Question & {
  checkpoints: Pick<Checkpoint, "interval_label" | "due_date" | "status" | "is_catchup">[];
};

export default async function ProblemsPage() {
  const supabase = await createClient();
  const { data: questions, error } = await supabase
    .from("questions")
    .select("*, checkpoints(interval_label, due_date, status, is_catchup)")
    .order("leetcode_number")
    .overrideTypes<Row[]>();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-8">
      <AppNav title="All problems" />

      {error && <p className="text-sm text-red-600">{error.message}</p>}

      {questions?.length === 0 && (
        <p className="text-sm text-gray-500">
          Nothing tracked yet.{" "}
          <Link href="/problems/new" className="underline">
            Add your first problem.
          </Link>
        </p>
      )}

      {!!questions?.length && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-gray-500 dark:border-gray-800">
              <tr>
                <th className="py-2 pr-4">#</th>
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Difficulty</th>
                <th className="py-2 pr-4">Topic</th>
                <th className="py-2">Next review</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q.id} className="border-b border-gray-100 dark:border-gray-900">
                  <td className="py-2 pr-4 text-gray-500">{q.leetcode_number}</td>
                  <td className="py-2 pr-4">
                    <Link href={`/problems/${q.id}`} className="hover:underline">
                      {q.title}
                    </Link>
                  </td>
                  <td className="py-2 pr-4">{q.difficulty}</td>
                  <td className="py-2 pr-4">{q.topic}</td>
                  <td className="py-2">{nextReview(q.checkpoints)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function nextReview(checkpoints: Row["checkpoints"]): string {
  const pending = checkpoints.find((c) => c.status !== "done" && c.due_date !== null);
  if (pending) {
    const label = pending.is_catchup ? pending.interval_label : `${pending.interval_label} review`;
    return `${label} · ${formatShort(pending.due_date!)}`;
  }
  // no pending rung = all seven done clean
  return checkpoints.length ? "graduated 🎓" : "—";
}
