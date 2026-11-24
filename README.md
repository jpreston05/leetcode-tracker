# Leetcode Tracker

Tracking leetcode problems to hold myself accountable.

A private, single-user app: I log solved LeetCode problems, attach photos of
my handwritten notes, and get a small daily queue of what to re-solve, with
review gaps that adapt to how each attempt went. **Signups are disabled — only my GitHub account can
log in.** The deployed site is a locked door; to run your own copy you'd
create your own Supabase project and lock it to your own account (steps
below).

**Stack:** Next.js (App Router, TypeScript) · Supabase (Postgres, Storage,
Auth) · Tailwind 4 · Vitest

Design language lives in [PRODUCT.md](PRODUCT.md) and [DESIGN.md](DESIGN.md)
("Evening Logbook": dark-only, OKLCH tokens, plain HTML/CSS charts).

## What it does

- **Today queue** — 1 new-problem slot plus up to 2 due reviews (most
  overdue first); 2 new slots on light days. Anything past the top 2 just
  rolls forward. Progress reads X/150 solved · Y in review · Z retired.
- **Dashboard** — this week's load, stats (problems, reviews, clean rate,
  retired), difficulty split, topic coverage, and a
  GitHub-style activity heatmap. A rotating quote keeps the Sydney plan in
  view.
- **Problem log** — each solve records difficulty, topic, and notes, with
  photos of handwritten working stored in a private bucket and served via
  short-lived signed URLs.
- **Attempt history** — every solve and review records date, minutes,
  grade (Clean / Shaky / Failed), an optional GitHub link, and notes. Any
  attempt can be edited or deleted; the schedule is recomputed from scratch.
- **Daily reminder email** — 12pm NZ via GitHub Actions + Resend: the same
  queue as the dashboard (top 2 reviews with overdue tags, "+N more", and the
  new-problem nudge), or a "nice work" note if today's work is already done.

## How scheduling works

Each problem has one interval that adapts to how each attempt went.
Reviews are full re-solves, graded:

- **Clean**: on my own, ≤15 min, no real bugs. (Over 15 min can't be Clean.)
- **Shaky**: on my own, but slow or buggy.
- **Failed**: needed a hint or the solution, or didn't finish.

The first review is 7 days out if confidence was 4–5, otherwise 1 day (1 day
regardless if the first solve failed). After that, with `gap` = actual days
since the previous attempt (so a late review earns its full gap):

| Grade  | Next interval            |
| ------ | ------------------------ |
| Clean  | `gap × 3`                |
| Shaky  | same as before           |
| Failed | 1 day                    |

A Clean review after a gap of 21+ days **retires** the problem: it leaves
the queue for good unless un-retired by hand (back to a 1-day interval). A
problem I know well takes about 3 attempts; the ones I struggle with get the
extra reviews.

The whole rule set is one pure, unit-tested function,
[`computeSchedule`](src/lib/schedule.ts), which replays a problem's attempt
history (plus "push to tomorrow" / un-retire events) from the start. The
`interval_days` / `next_due` / `retired_on` columns on `questions` are just
a cache of that replay, rewritten after every change, so editing or deleting
an old attempt can never leave the schedule inconsistent. All dates are pinned to Pacific/Auckland — "today" means NZ today, whether
the code runs on my laptop or a UTC Vercel server.

## One-time Supabase setup

1. Create a free project at [supabase.com](https://supabase.com).
2. **Schema:** open the SQL Editor and run every file in
   [`supabase/`](supabase/) in order: `schema.sql`, then `v2-…` through
   `v7-attempts.sql`. (Schema changes are hand-run numbered files, no
   migration tooling. v2–v6 build the old ladder that v7 migrates away from.)
3. **GitHub OAuth:**
   - GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.
     - Homepage URL: `http://localhost:3000` (add your prod URL later)
     - Callback URL: `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
   - Supabase → Authentication → Providers → GitHub: enable, paste Client ID + Secret.
4. **Env vars:** copy `.env.example` to `.env.local`, fill in the URL and anon key
   from Project Settings → API.
5. Run the app, sign in once with your GitHub account, **then** lock the door:
   Supabase → Authentication → Settings → disable **"Allow new users to sign up"**.
   Your existing user keeps working; nobody else can ever register. This is
   what makes the app single-user.

## Develop

```bash
npm install
npm run dev   # http://localhost:3000
npm test      # Vitest — pure logic in src/lib/*.test.ts
```

## Deploy (Vercel)

1. [vercel.com](https://vercel.com) → Add New Project → import this repo (defaults are fine).
2. Add the two env vars from `.env.example` in Project Settings → Environment Variables.
3. After the first deploy, tell Supabase about the prod URL:
   Authentication → URL Configuration → set Site URL to your Vercel URL and add
   `https://YOUR-APP.vercel.app/auth/callback` to Redirect URLs.

## GitHub Actions

Both workflows run from `main` and read **repository secrets** (GitHub →
repo → Settings → Secrets and variables → Actions) — nothing here lives in
the app or Vercel.

- **Keep-warm** (`.github/workflows/keep-warm.yml`) — Supabase free projects
  pause after 7 idle days; this pings the REST API every 3 days. Needs
  `SUPABASE_URL` and `SUPABASE_ANON_KEY` (the anon key is public by design,
  but a secret keeps it out of logs).
- **Daily reminder** (`.github/workflows/daily-reminder.yml`) — the 12pm NZ
  email described above. Needs:
  - `SUPABASE_SECRET_KEY` — Project Settings → API → **secret key**
    (`sb_secret_…`). Service-role: it bypasses RLS to read due rows, which is
    why it lives only in GitHub's secret store, never in the app.
  - `RESEND_API_KEY` — free account at [resend.com](https://resend.com) → API key.
  - `REMINDER_EMAIL` — where to send it.

After adding secrets, run each workflow once by hand (Actions → Run workflow)
to confirm it works.
