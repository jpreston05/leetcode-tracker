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
    <section className="mb-12">
      <h1 className="text-2xl font-semibold tracking-tight text-balance">{NAME}</h1>
      <p className="mt-2 max-w-[55ch] text-sm leading-relaxed text-muted text-balance">{BLURB}</p>
      {LINKS.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="text-muted underline decoration-line-strong underline-offset-4 transition-colors duration-150 hover:text-ink"
            >
              {l.label} ↗
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
