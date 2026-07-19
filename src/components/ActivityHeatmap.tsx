import { createClient } from "@/lib/supabase/server";
import { addDaysISO, computeStreaks, formatShort, todayISO } from "@/lib/checkpoints";

interface DayActivity {
  day: string;
  solved: number;
  reviewed: number;
  total: number;
}

// Intensity buckets: 0, 1, 2-3, 4-5, 6+
const CELL_CLASSES = [
  "bg-gray-100 dark:bg-gray-800",
  "bg-green-200 dark:bg-green-900",
  "bg-green-400 dark:bg-green-700",
  "bg-green-600 dark:bg-green-500",
  "bg-green-800 dark:bg-green-300",
];

function intensity(total: number): number {
  if (total === 0) return 0;
  if (total === 1) return 1;
  if (total <= 3) return 2;
  if (total <= 5) return 3;
  return 4;
}

function weekday(iso: string): number {
  return new Date(`${iso}T12:00:00`).getDay(); // 0 = Sunday
}

// GitHub-style contribution graph: Sunday-first columns, current week
// rightmost, trailing 52 weeks. Data comes from the activity_daily view.
export default async function ActivityHeatmap() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_daily")
    .select("*")
    .overrideTypes<DayActivity[]>();

  if (error) return <p className="text-sm text-red-600">{error.message}</p>;

  const today = todayISO();
  const byDay = new Map((data ?? []).map((d) => [d.day, d]));
  const streaks = computeStreaks(
    (data ?? []).filter((d) => d.total > 0).map((d) => d.day),
    today
  );

  // Grid runs from the Sunday 52 weeks before this week's Sunday, through today.
  const start = addDaysISO(addDaysISO(today, -weekday(today)), -52 * 7);
  const weeks: (string | null)[][] = [];
  for (let w = 0; w <= 52; w++) {
    weeks.push(
      Array.from({ length: 7 }, (_, r) => {
        const day = addDaysISO(start, w * 7 + r);
        return day <= today ? day : null;
      })
    );
  }

  // Label a column when its Sunday lands in a different month than the previous one.
  const monthLabels = weeks.map((week, i) => {
    if (i === 0) return null;
    const prev = new Date(`${weeks[i - 1][0]}T12:00:00`).getMonth();
    const cur = new Date(`${week[0]}T12:00:00`).getMonth();
    return cur !== prev
      ? new Date(`${week[0]}T12:00:00`).toLocaleDateString("en-NZ", { month: "short" })
      : null;
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col">
          <div className="ml-8 flex gap-[3px] text-[10px] leading-3 text-gray-500">
            {monthLabels.map((label, i) => (
              <div key={i} className="w-3 overflow-visible whitespace-nowrap">
                {label}
              </div>
            ))}
          </div>
          <div className="flex gap-[3px]">
            <div className="mr-1 flex w-7 flex-col gap-[3px] text-[10px] leading-3 text-gray-500">
              {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
                <div key={i} className="h-3">
                  {d}
                </div>
              ))}
            </div>
            {weeks.map((week, w) => (
              <div key={w} className="flex flex-col gap-[3px]">
                {week.map((day, r) =>
                  day === null ? (
                    <div key={r} className="h-3 w-3" />
                  ) : (
                    <Cell key={r} day={day} activity={byDay.get(day)} />
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-gray-500">
        <span>
          Current streak: <strong>{streaks.current}</strong> day{streaks.current === 1 ? "" : "s"}
          {" · "}
          Longest: <strong>{streaks.longest}</strong> day{streaks.longest === 1 ? "" : "s"}
        </span>
        <span className="flex items-center gap-1">
          Less
          {CELL_CLASSES.map((c) => (
            <span key={c} className={`h-3 w-3 rounded-sm ${c}`} />
          ))}
          More
        </span>
      </div>
    </div>
  );
}

function Cell({ day, activity }: { day: string; activity?: DayActivity }) {
  const total = activity?.total ?? 0;
  const title = total
    ? `${total} on ${formatShort(day)} — ${activity!.solved} solved, ${activity!.reviewed} review${activity!.reviewed === 1 ? "" : "s"}`
    : `No activity on ${formatShort(day)}`;
  return <div className={`h-3 w-3 rounded-sm ${CELL_CLASSES[intensity(total)]}`} title={title} />;
}
