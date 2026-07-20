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

- **Checkpoints are a DB-enforced state machine.** The `checkpoints` table has
  NO insert/update/delete RLS policies. All writes go through security-definer
  functions: the `generate_ladder` trigger (7 rungs on question insert),
  `complete_checkpoint` (rejects anything but the due, unlocked rung; clean →
  unlock next rung, else insert a 3-day catch-up), `undo_checkpoint` (same-day
  only). The UI calls these via `supabase.rpc()` — never write checkpoint rows
  directly.
- **At most one actionable checkpoint per question**: the only non-done row
  with a non-null `due_date`. Locked rungs have `due_date = NULL`
  (completion-anchored scheduling — future dates are unknowable). The
  dashboard agenda query relies on this.
- **Dates are NZ-pinned**: `nz_today()` in SQL, `todayISO()` in
  `src/lib/checkpoints.ts` (Pacific/Auckland). Vercel runs UTC — never use
  `new Date()` date math directly for "today".
- **Photos** live in the private `note-photos` bucket at
  `{user_id}/{question_id}/{uuid}.jpg`, tracked in `note_photos` rows,
  rendered via short-lived signed URLs. Never make the bucket public.
- **Schema changes are hand-run SQL files** in `supabase/` (`schema.sql`,
  `v2-checkpoints.sql`, `v4-photos-undo.sql`) — no migration tooling. Add a
  new numbered file per change; the user pastes it into the SQL editor.

## Conventions

- Pure logic lives in `src/lib/` with Vitest coverage; components stay thin.
- Data text wears `.data` (Geist Mono, tabular); color never carries meaning
  alone (words/icons accompany outcome + difficulty colors — see
  `src/lib/ui.ts`).
- Buttons/inputs use the `.btn-*` / `.field` classes from globals.css.
- Charts are plain HTML/CSS with validated mark tokens (`*-mark` colors);
  read DESIGN.md's Charts section before adding any.
- Motion: 150–250ms, `--ease-strong`, state-conveying only,
  `prefers-reduced-motion` collapse is global.

## Ops

- GitHub Actions: `keep-warm.yml` (Supabase free tier pauses after 7 idle
  days) and `daily-reminder.yml` (5pm NZ, Resend email every day: due problems
  grouped by review interval, or a "solve something new" nudge on clear days). Secrets live in GitHub repo settings, NOT in the app
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
