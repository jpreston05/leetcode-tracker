import { createClient } from "@/lib/supabase/server";
import { addDaysISO, computeStreaks, formatShort, todayISO } from "@/lib/checkpoints";

interface DayActivity {
  day: string;
  solved: number;
  reviewed: number;
  total: number;
}

// Intensity buckets: 0, 1, 2-3, 4-5, 6+ — our olive ramp, not GitHub green.
const CELL_CLASSES = ["bg-raised", "bg-heat1", "bg-heat2", "bg-heat3", "bg-heat4"];

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

// Contribution-graph layout: Sunday-first columns, current week rightmost,
// trailing 52 weeks, fed by the activity_daily view.
export default async function ActivityHeatmap() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_daily")
    .select("*")
    .overrideTypes<DayActivity[]>();

  if (error) return <p className="text-sm text-danger">{error.message}</p>;

  const today = todayISO();
  const byDay = new Map((data ?? []).map((d) => [d.day, d]));
  const streaks = computeStreaks(
    (data ?? []).filter((d) => d.total > 0).map((d) => d.day),
    today
  );

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

  const monthLabels = weeks.map((week, i) => {
    if (i === 0) return null;
    const prev = new Date(`${weeks[i - 1][0]}T12:00:00`).getMonth();
    const cur = new Date(`${week[0]}T12:00:00`).getMonth();
    return cur !== prev
      ? new Date(`${week[0]}T12:00:00`).toLocaleDateString("en-NZ", { month: "short" })
      : null;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto pb-1" dir="rtl">
        {/* rtl + rightmost-recent: phone widths land on the current weeks first */}
        <div className="inline-flex flex-col" dir="ltr">
          <div className="data ml-8 flex gap-[3px] text-[10px] leading-3 text-faint">
            {monthLabels.map((label, i) => (
              <div key={i} className="w-3 overflow-visible whitespace-nowrap">
                {label}
              </div>
            ))}
          </div>
          <div className="mt-1 flex gap-[3px]">
            <div className="data mr-1 flex w-7 flex-col gap-[3px] text-[10px] leading-3 text-faint">
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

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-muted">
        <span className="data">
          streak <strong className="text-ink">{streaks.current}d</strong>
          <span className="mx-2 text-faint">·</span>
          longest <strong className="text-ink">{streaks.longest}d</strong>
        </span>
        <span className="flex items-center gap-1 text-faint">
          Less
          {CELL_CLASSES.map((c) => (
            <span key={c} className={`h-3 w-3 rounded-[3px] ${c}`} />
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
  return <div className={`h-3 w-3 rounded-[3px] ${CELL_CLASSES[intensity(total)]}`} title={title} />;
}
