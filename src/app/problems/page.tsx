import Link from "next/link";
import AppNav from "@/components/AppNav";
import LadderRail from "@/components/LadderRail";
import { createClient } from "@/lib/supabase/server";
import { formatShort, todayISO } from "@/lib/checkpoints";
import { difficultyClass } from "@/lib/ui";
import type { Checkpoint, Question } from "@/lib/types";

type Row = Question & {
  checkpoints: Pick<
    Checkpoint,
    "sequence" | "interval_label" | "due_date" | "status" | "is_catchup"
  >[];
};

export default async function ProblemsPage() {
  const supabase = await createClient();
  const today = todayISO();
  const { data: questions, error } = await supabase
    .from("questions")
    .select("*, checkpoints(sequence, interval_label, due_date, status, is_catchup)")
    .order("leetcode_number")
    .overrideTypes<Row[]>();

  return (
    <>
      <AppNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-8 flex items-baseline gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Problems</h1>
          {!!questions?.length && (
            <span className="data text-sm text-faint">{questions.length}</span>
          )}
        </div>

        {error && <p className="text-sm text-danger">{error.message}</p>}

        {questions?.length === 0 && (
          <div className="rounded-xl border border-line px-6 py-10 text-center">
            <p className="mb-1 text-sm font-medium">The logbook is empty</p>
            <p className="mb-5 text-sm text-muted">
              Every problem you add climbs a 7-rung review ladder from 1 day to 6 months.
            </p>
            <Link href="/problems/new" className="btn-primary">
              Add your first solve
            </Link>
          </div>
        )}

        {!!questions?.length && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-faint">
                  <th className="py-2 pr-4 font-medium">Problem</th>
                  <th className="py-2 pr-4 font-medium">Topic</th>
                  <th className="w-32 py-2 pr-4 font-medium">Ladder</th>
                  <th className="py-2 text-right font-medium">Next</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <ProblemRow key={q.id} q={q} today={today} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}

function ProblemRow({ q, today }: { q: Row; today: string }) {
  const pending = q.checkpoints.find((c) => c.status !== "done" && c.due_date !== null);
  const graduated = !pending && q.checkpoints.length > 0;

  return (
    <tr className="group border-b border-line/60 transition-colors duration-150 hover:bg-surface">
      <td className="py-3 pr-4">
        <Link href={`/problems/${q.id}`} className="flex items-baseline gap-2">
          <span className="data text-faint">{q.leetcode_number}</span>
          <span className="font-medium group-hover:text-ink">{q.title}</span>
          <span className={`text-xs ${difficultyClass[q.difficulty]}`}>{q.difficulty}</span>
        </Link>
      </td>
      <td className="py-3 pr-4 text-muted">{q.topic}</td>
      <td className="py-3 pr-4">
        <LadderRail checkpoints={q.checkpoints} today={today} />
      </td>
      <td className="data py-3 text-right text-xs">
        {graduated ? (
          <span className="text-olive">graduated</span>
        ) : pending ? (
          <span
            className={
              pending.due_date! <= today
                ? pending.due_date! < today
                  ? "text-danger"
                  : "text-olive"
                : "text-muted"
            }
          >
            {pending.due_date! <= today ? "due" : formatShort(pending.due_date!)}
          </span>
        ) : (
          <span className="text-faint">—</span>
        )}
      </td>
    </tr>
  );
}
