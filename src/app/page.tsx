import Link from "next/link";
import ActivityHeatmap from "@/components/ActivityHeatmap";
import AppNav from "@/components/AppNav";
import UpcomingAgenda, { type AgendaRow } from "@/components/UpcomingAgenda";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/checkpoints";

export default async function HomePage() {
  const supabase = await createClient();
  const today = todayISO();

  const { data: rows, error } = await supabase
    .from("checkpoints")
    .select("*, questions(id, leetcode_number, title, difficulty, topic)")
    .neq("status", "done")
    .not("due_date", "is", null)
    .order("due_date")
    .overrideTypes<AgendaRow[]>();

  const dueCount = rows?.filter((r) => r.due_date! <= today).length ?? 0;

  return (
    <>
      <AppNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-10">
          <p className="data mb-1 text-sm text-faint">
            {new Date(`${today}T12:00:00`).toLocaleDateString("en-NZ", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            {dueCount === 0
              ? "All clear tonight"
              : `${dueCount} review${dueCount === 1 ? "" : "s"} due`}
          </h1>
        </div>

        {error ? (
          <p className="text-sm text-danger">{error.message}</p>
        ) : rows?.length ? (
          <UpcomingAgenda rows={rows} today={today} />
        ) : (
          <div className="rounded-xl border border-line px-6 py-10 text-center">
            <p className="mb-1 text-sm font-medium">Nothing scheduled yet</p>
            <p className="mb-5 text-sm text-muted">
              Log a solved problem and its review ladder starts tomorrow.
            </p>
            <Link href="/problems/new" className="btn-primary">
              Add your first solve
            </Link>
          </div>
        )}

        <section className="mt-14">
          <h2 className="mb-4 text-sm font-medium text-muted">Activity</h2>
          <ActivityHeatmap />
        </section>
      </main>
    </>
  );
}
