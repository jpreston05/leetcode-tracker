// The public portfolio's introduction — who this is and where to reach them.
// Edit the copy and links here; a link only renders when its href is set, so
// LinkedIn stays hidden until you drop the URL in.
const NAME = "Jack Preston";
const BLURB =
  "Software engineering student. Every problem I solve comes back for timed re-solves, spaced further apart each time it goes cleanly, until it retires — this is the logbook, with links to each solution.";

const LINKS: { label: string; href: string }[] = [
  { label: "jackpreston.me", href: "https://jackpreston.me" },
  { label: "GitHub", href: "https://github.com/jpreston05" },
  { label: "LinkedIn", href: "" }, // ← add your LinkedIn URL to show this link
].filter((l) => l.href);

export default function PortfolioHero() {
  return (
    <section className="relative mb-10 overflow-hidden rounded-3xl bg-brand-soft px-6 py-8 sm:px-8">
      {/* the palette shapes again: the same journey as the brand mark */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-5 -right-5 flex origin-top-right scale-[0.55] items-end gap-2 opacity-90 sm:top-auto sm:-right-4 sm:-bottom-4 sm:origin-bottom-right sm:scale-100 sm:opacity-100"
      >
        <span className="h-12 w-12 rounded-full bg-sun" />
        <span className="h-20 w-14 rounded-2xl bg-sky" />
        <span className="h-16 w-16 rotate-12 rounded-2xl bg-grape" />
      </div>
      <h1 className="relative text-3xl font-extrabold tracking-tight sm:text-4xl">{NAME}</h1>
      <p className="relative mt-3 max-w-[48ch] text-pretty text-muted sm:pr-40">{BLURB}</p>
      {LINKS.length > 0 && (
        <div className="relative mt-5 flex flex-wrap items-center gap-2 text-sm">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary px-3.5 py-1.5"
            >
              {l.label} ↗
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
