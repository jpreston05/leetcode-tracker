import Link from "next/link";
import AppNav from "@/components/AppNav";
import { createClient } from "@/lib/supabase/server";
import type { Question } from "@/lib/types";

export default async function ProblemsPage() {
  const supabase = await createClient();
  const { data: questions, error } = await supabase
    .from("questions")
    .select("*")
    .order("leetcode_number")
    .overrideTypes<Question[]>();

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
                <th className="py-2 pr-4">Box</th>
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
                  <td className="py-2 pr-4">{q.leitner_box}</td>
                  <td className="py-2">{q.next_review_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
