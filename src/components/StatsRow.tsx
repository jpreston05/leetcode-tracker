// A divided row of big mono numbers, each wearing its role colour (words
// underneath carry the meaning).
interface Props {
  mostInDay: number | null;
  problems: number;
  reviews: number;
  cleanRate: number | null;
  retired: number;
}

export default function StatsRow({ mostInDay, problems, reviews, cleanRate, retired }: Props) {
  const figures: { value: string; label: string; color: string }[] = [
    { value: mostInDay === null ? "—" : String(mostInDay), label: "most in a day", color: "text-brand-ink" },
    { value: `${problems} · ${reviews}`, label: "problems · reviews", color: "text-sky-ink" },
    { value: cleanRate === null ? "—" : `${cleanRate}%`, label: "clean rate", color: "text-mint-ink" },
    { value: String(retired), label: "retired", color: "text-grape-ink" },
  ];

  return (
    <dl className="grid grid-cols-2 gap-y-6 sm:grid-cols-4">
      {figures.map(({ value, label, color }) => (
        <div
          key={label}
          className="border-l border-line pl-4 first:border-l-0 first:pl-0 sm:[&:nth-child(3)]:border-l max-sm:[&:nth-child(3)]:border-l-0 max-sm:[&:nth-child(3)]:pl-0"
        >
          <dd className={`data text-2xl font-bold ${color}`}>{value}</dd>
          <dt className="mt-0.5 text-xs text-muted">{label}</dt>
        </div>
      ))}
    </dl>
  );
}
