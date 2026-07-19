import Link from "next/link";
import { notFound } from "next/navigation";
import AppNav from "@/components/AppNav";
import DeleteProblemButton from "@/components/DeleteProblemButton";
import ProblemForm from "@/components/ProblemForm";
import { createClient } from "@/lib/supabase/server";
import type { Question } from "@/lib/types";

export default async function EditProblemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: question } = await supabase
    .from("questions")
    .select("*")
    .eq("id", id)
    .maybeSingle<Question>();

  if (!question) notFound();

  return (
    <>
      <AppNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Edit problem</h1>
          <p className="mt-1 text-sm text-muted">
            Editing details never rewrites the review ladder or its history.
          </p>
        </div>
        <ProblemForm initial={question} />

        <section className="mt-14 border-t border-line pt-8">
          <DeleteProblemButton questionId={question.id} />
        </section>

        <p className="mt-10 text-sm">
          <Link
            href={`/problems/${question.id}`}
            className="text-muted transition-colors duration-150 hover:text-ink"
          >
            ← Back to problem
          </Link>
        </p>
      </main>
    </>
  );
}
