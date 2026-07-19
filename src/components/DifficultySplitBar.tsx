import type { DifficultySplit } from "@/lib/stats";
import type { Difficulty } from "@/lib/types";

// Proportion bar (GitHub-language-bar idiom). Mark colors are the validated
// chart steps, not the text tokens; identity is never color-alone — fixed
// order + 2px gaps + the labeled legend carry it for CVD readers.
const MARK: Record<Difficulty, string> = {
  Easy: "bg-easy-mark",
  Medium: "bg-medium-mark",
  Hard: "bg-hard-mark",
};
const ORDER: Difficulty[] = ["Easy", "Medium", "Hard"];

export default function DifficultySplitBar({ split }: { split: DifficultySplit }) {
  if (split.total === 0) return null;

  return (
    <div>
      <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full">
        {ORDER.filter((d) => split.counts[d] > 0).map((d) => (
          <div
            key={d}
            className={`h-full min-w-1 ${MARK[d]}`}
            style={{ width: `${split.pct[d]}%` }}
            title={`${d} — ${split.counts[d]} of ${split.total} (${Math.round(split.pct[d])}%)`}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs">
        {ORDER.map((d) => (
          <span key={d} className="flex items-center gap-1.5">
            <span aria-hidden className={`h-2 w-2 rounded-full ${MARK[d]}`} />
            <span className="text-muted">{d}</span>
            <span className="data text-ink">{split.counts[d]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
