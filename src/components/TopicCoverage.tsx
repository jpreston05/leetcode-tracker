import Link from "next/link";
import type { TopicRow } from "@/lib/stats";

const TOP_N = 8;

// Ranked topic tags with proportional bars and per-topic review quality —
// "I log lots of DP but fail DP reviews" is the insight that directs study.
// Topic names link to the filtered problems list.
export default function TopicCoverage({ topics }: { topics: TopicRow[] }) {
  if (topics.length === 0) return null;
  const shown = topics.slice(0, TOP_N);
  const rest = topics.length - shown.length;
  const max = shown[0].count;

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[7rem_1fr_2rem_3.5rem] items-center gap-3 text-[10px] text-faint">
        <span />
        <span />
        <span className="data text-right">#</span>
        <span className="data text-right">clean</span>
      </div>
      {shown.map(({ topic, count, reviews, cleanPct }) => (
        <div key={topic} className="group grid grid-cols-[7rem_1fr_2rem_3.5rem] items-center gap-3">
          <Link
            href={`/problems?topic=${encodeURIComponent(topic)}`}
            className="truncate text-sm text-muted transition-colors duration-150 hover:text-ink hover:underline"
            title={`Show ${topic} problems`}
          >
            {topic}
          </Link>
          <div className="h-1.5 rounded-full">
            <div
              className="h-full min-w-1 rounded-full bg-heat3 transition-colors duration-150 group-hover:bg-heat4"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="data text-right text-xs text-ink">{count}</span>
          <span
            className="data text-right text-xs text-muted"
            title={cleanPct === null ? "No reviews yet" : `${cleanPct}% clean over ${reviews} review${reviews === 1 ? "" : "s"}`}
          >
            {cleanPct === null ? "—" : `${cleanPct}%`}
          </span>
        </div>
      ))}
      {rest > 0 && <p className="text-xs text-faint">+ {rest} more topic{rest === 1 ? "" : "s"}</p>}
    </div>
  );
}
