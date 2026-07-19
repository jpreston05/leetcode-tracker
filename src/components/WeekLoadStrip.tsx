// Next 7 days of review load: labeled mini columns, single hue (magnitude),
// today emphasized in the accent. The counts are the data; bars are the shape.
export default function WeekLoadStrip({ load }: { load: { date: string; count: number }[] }) {
  const max = Math.max(...load.map((d) => d.count), 1);

  return (
    <div className="flex gap-2">
      {load.map(({ date, count }, i) => {
        const label =
          i === 0
            ? "Today"
            : new Date(`${date}T12:00:00`).toLocaleDateString("en-NZ", { weekday: "short" });
        const title = `${count} review${count === 1 ? "" : "s"} ${
          i === 0 ? "today" : `on ${label} ${new Date(`${date}T12:00:00`).getDate()}`
        }`;
        return (
          <div key={date} className="flex flex-1 flex-col items-center gap-1.5" title={title}>
            <div className="flex h-14 w-full items-end">
              {count > 0 ? (
                <div
                  className={`w-full rounded-sm ${i === 0 ? "bg-olive" : "bg-heat3"}`}
                  style={{ height: `${Math.max((count / max) * 100, 12)}%` }}
                />
              ) : (
                <div className="h-0.5 w-full rounded-sm bg-raised" />
              )}
            </div>
            <span className={`data text-xs ${count > 0 ? "text-ink" : "text-faint"}`}>{count}</span>
            <span className={`data text-[10px] ${i === 0 ? "text-olive" : "text-faint"}`}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
