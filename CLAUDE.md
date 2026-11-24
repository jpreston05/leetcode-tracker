@AGENTS.md

# LeetCode Tracker

Private single-user spaced-repetition tracker for LeetCode problems (owner:
jpreston05). Portfolio project — clarity over cleverness. Next.js App Router
(TS, Tailwind 4) + hosted Supabase (Postgres/Storage/Auth, GitHub OAuth,
signups disabled). Design language: PRODUCT.md + DESIGN.md ("Evening Logbook",
dark-only, OKLCH tokens in `src/app/globals.css`).

## Commands

- `npm run dev` / `npm run build`
- `npm test` (Vitest — pure logic in `src/lib/*.test.ts`)

## Architecture invariants (don't break these)

- **Attempts are the source of truth; the schedule is derived.** Every solve
  or review is a row in `attempts` (the earliest per question is the first
  solve); manual "push to tomorrow" / un-retire are rows in `schedule_events`.
  `questions.interval_days` / `next_due` / `retired_on` are a CACHE produced
  only by replaying that history through `computeSchedule`
  (`src/lib/schedule.ts`, pure + tested). Never patch those columns — write
  via `src/lib/attempts.ts`, whose helpers always end in `recomputeQuestion`.
  `questions.date_solved` is kept in sync with the first attempt's date.
  NULL `interval_days` = not computed yet; the owner dashboard self-heals
  those on load.
- **Scheduling rules live in one place.** Clean ≤15 min; Clean → gap×3,
  Shaky → same interval, Failed → 1 day; Clean at gap ≥21 retires. The Today
  queue (`src/lib/queue.ts`: ≤2 reviews/day + "try the next one", 1–2 new slots) is mirrored in jq in
  `daily-reminder.yml` — keep in sync.
- **The old ladder is archived, not live.** `checkpoints` + its RPCs
  (v2/v4/v5) were frozen by v7 (trigger dropped, execute revoked). Don't read
  or write it from the app.
- **Dates are NZ-pinned**: `nz_today()` in SQL, `todayISO()` in
  `src/lib/dates.ts` (Pacific/Auckland). Vercel runs UTC — never use
  `new Date()` date math directly for "today".
- **Photos** live in the private `note-photos` bucket at
  `{user_id}/{question_id}/{uuid}.jpg`, tracked in `note_photos` rows,
  rendered via short-lived signed URLs. Never make the bucket public.
- **Schema changes are hand-run SQL files** in `supabase/` (`schema.sql`,
  `v2-checkpoints.sql`, `v4-photos-undo.sql`) — no migration tooling. Add a
  new numbered file per change; the user pastes it into the SQL editor.
  (`v5-solution-links.sql` adds `questions.solution_url` +
  `checkpoints.solution_url` and the `set_checkpoint_solution` function.)
  (`v6-public-portfolio.sql` adds the `public_questions` /
  `public_checkpoints` / `public_activity` views.)
  (`v7-attempts.sql` adds `attempts`, `schedule_events`, the schedule cache
  columns, `public_attempts` + `public_questions.retired`, drops
  `public_checkpoints`, and migrates ladder history into attempts.)
- **Public portfolio is view-gated, not RLS-gated.** Viewing (`/`,
  `/problems`, `/problems/:id`) is open to anonymous visitors; only
  `/problems/new` and `/problems/:id/edit` require auth (guarded in
  `src/proxy.ts`). Base-table RLS stays owner-only — anonymous reads go
  through the `public_*` views (v6), which are `security_invoker = false`
  (bypass RLS) and expose only portfolio-safe columns (no notes, confidence,
  photo paths, or schedule). Pages branch on `isOwner` (`getUser()`); the
  owner path queries base tables, the public path queries the views. Never add
  private columns to a `public_*` view.

## Conventions

- Pure logic lives in `src/lib/` with Vitest coverage; components stay thin.
- Data text wears `.data` (Geist Mono, tabular); color never carries meaning
  alone (words/icons accompany grade + difficulty colors — see
  `src/lib/ui.ts`).
- Buttons/inputs use the `.btn-*` / `.field` classes from globals.css.
- Charts are plain HTML/CSS with validated mark tokens (`*-mark` colors);
  read DESIGN.md's Charts section before adding any.
- Motion: 150–250ms, `--ease-strong`, state-conveying only,
  `prefers-reduced-motion` collapse is global.

## Ops

- GitHub Actions: `keep-warm.yml` (Supabase free tier pauses after 7 idle
  days) and `daily-reminder.yml` (12pm NZ, Resend email every day: the Today
  queue — top 2 due reviews, "+N more", 1–2 new-problem nudge — or a "nice
  work" note if today's work is already done).
  Secrets live in GitHub repo settings, NOT in the app
  or Vercel: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY`,
  `RESEND_API_KEY`, `REMINDER_EMAIL`. Scheduled workflows only run from
  `main`. The reminder's quote list mirrors `src/lib/quotes.ts` — keep in sync.
- Vercel needs only the two `NEXT_PUBLIC_*` vars from `.env.example`.

## Gotchas

- **The user creates/switches git branches between turns.** Run
  `git branch --show-current` before the first commit of any turn; push with
  the current branch's name, never an assumed one.
- `.env.local` is gitignored and holds only the public URL + publishable key.
- v2's `reviews` table and `questions.leitner_box`/`next_review_date`/
  `photo_path` no longer exist — old docs/commits reference them.
