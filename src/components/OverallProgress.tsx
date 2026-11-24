import type { Progress } from "@/lib/stats";

// X/150 as one stacked bar: retired (grape) then in review (sky), the rest an
// empty track. Legend dots + mono counts carry the numbers.
export default function OverallProgress({ progress }: { progress: Progress }) {
  const { solved, inReview, retired, total } = progress;
  const pct = (n: number) => `${(n / total) * 100}%`;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="text-sm font-bold">
          <span className="data text-base">{solved}</span>
          <span className="data text-muted">/{total}</span> solved
        </p>
        <p className="data text-xs text-muted">{total - solved} to go</p>
      </div>
      <div
        role="img"
        aria-label={`${solved} of ${total} solved: ${retired} retired, ${inReview} in review`}
        className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-raised"
      >
        {retired > 0 && <div className="h-full rounded-full bg-grape-mark" style={{ width: pct(retired) }} />}
        {inReview > 0 && <div className="h-full rounded-full bg-sky-mark" style={{ width: pct(inReview) }} />}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2 w-2 rounded-full bg-grape-mark" />
          retired <span className="data text-ink">{retired}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2 w-2 rounded-full bg-sky-mark" />
          in review <span className="data text-ink">{inReview}</span>
        </span>
      </div>
    </div>
  );
}
