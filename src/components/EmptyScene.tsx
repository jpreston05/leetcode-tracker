import Link from "next/link";

// Empty states get a small, friendly scene built from the palette shapes
// (no stock illustration) plus a line that teaches what to do next.
export default function EmptyScene({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <div aria-hidden className="relative mb-6 h-20 w-40">
        <span className="absolute bottom-0 left-2 h-10 w-10 rounded-full bg-sun" />
        <span className="absolute bottom-0 left-14 h-16 w-12 rounded-2xl bg-sky" />
        <span className="absolute right-3 bottom-0 h-12 w-12 rotate-12 rounded-2xl bg-grape" />
        <span className="absolute top-0 left-[4.6rem] h-5 w-5 rounded-full bg-mint" />
        <span className="absolute top-3 right-1 h-3 w-3 rounded-full bg-coral" />
      </div>
      <p className="text-lg font-bold">{title}</p>
      <p className="mt-1 max-w-[40ch] text-sm text-muted">{body}</p>
      {action && (
        <Link href={action.href} className="btn-primary mt-6">
          {action.label}
        </Link>
      )}
    </div>
  );
}
