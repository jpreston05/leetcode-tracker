// Logbook figures, not stat cards: a divided row of mono numbers.
interface Props {
  mostInDay: number | null;
  problems: number;
  reviews: number;
  cleanRate: number | null;
  graduated: number;
}

export default function StatsRow({ mostInDay, problems, reviews, cleanRate, graduated }: Props) {
  const figures: { value: string; label: string }[] = [
    { value: mostInDay === null ? "—" : String(mostInDay), label: "most in a day" },
    { value: `${problems} · ${reviews}`, label: "problems · reviews" },
    { value: cleanRate === null ? "—" : `${cleanRate}%`, label: "clean rate" },
    { value: String(graduated), label: "graduated" },
  ];

  return (
    <dl className="grid grid-cols-2 gap-y-6 sm:grid-cols-4">
      {figures.map(({ value, label }) => (
        <div
          key={label}
          className="border-l border-line pl-4 first:border-l-0 first:pl-0 sm:[&:nth-child(3)]:border-l max-sm:[&:nth-child(3)]:border-l-0 max-sm:[&:nth-child(3)]:pl-0"
        >
          <dd className="data text-xl text-ink">{value}</dd>
          <dt className="mt-0.5 text-xs text-muted">{label}</dt>
        </div>
      ))}
    </dl>
  );
}
