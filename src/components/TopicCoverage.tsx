const TOP_N = 8;

// Ranked topic tags with proportional bars — exposes prep blind spots.
export default function TopicCoverage({ topics }: { topics: { topic: string; count: number }[] }) {
  if (topics.length === 0) return null;
  const shown = topics.slice(0, TOP_N);
  const rest = topics.length - shown.length;
  const max = shown[0].count;

  return (
    <div className="flex flex-col gap-2">
      {shown.map(({ topic, count }) => (
        <div key={topic} className="grid grid-cols-[7rem_1fr_2rem] items-center gap-3">
          <span className="truncate text-sm text-muted" title={topic}>
            {topic}
          </span>
          <div className="h-1.5 rounded-full">
            <div
              className="h-full min-w-1 rounded-full bg-heat3"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="data text-right text-xs text-ink">{count}</span>
        </div>
      ))}
      {rest > 0 && <p className="text-xs text-faint">+ {rest} more topic{rest === 1 ? "" : "s"}</p>}
    </div>
  );
}
