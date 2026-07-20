# Leetcode Tracker

Tracking leetcode problems to hold myself accountable.

A private, single-user app: I log solved LeetCode problems, attach photos of
my handwritten notes, and get told what to re-solve tonight via a 7-rung
spaced-repetition ladder. **Signups are disabled — only my GitHub account can
log in.** The deployed site is a locked door; to run your own copy you'd
create your own Supabase project and lock it to your own account (steps
below).

**Stack:** Next.js (App Router, TypeScript) · Supabase (Postgres, Storage,
Auth) · Tailwind 4 · Vitest

Design language lives in [PRODUCT.md](PRODUCT.md) and [DESIGN.md](DESIGN.md)
("Evening Logbook": dark-only, OKLCH tokens, plain HTML/CSS charts).

## What it does

- **Dashboard** — tonight's due reviews, this week's load, stats (problems,
  reviews, clean rate, graduated), difficulty split, topic coverage, and a
  GitHub-style activity heatmap. A rotating quote keeps the Sydney plan in
  view.
- **Problem log** — each solve records difficulty, topic, and notes, with
  photos of handwritten working stored in a private bucket and served via
  short-lived signed URLs.
- **Review ladder** — every problem climbs 1 day → 3 days → 1 week → 2 weeks →
  1 month → 3 months → 6 months. Completing all seven rungs graduates it.
- **Same-day undo** — a mis-click on "reviewed" can be reversed until
  midnight (NZ time), nothing after that.
- **Daily reminder email** — 5pm NZ via GitHub Actions + Resend: due problems
  grouped by review interval with overdue tags, or a "solve something new"
  nudge on clear days.

## How scheduling works

Rungs unlock one at a time, and scheduling is **completion-anchored**:
finishing rung N today puts rung N+1 at today + its interval, so being late
never compresses the rest of the schedule. A review that goes badly
(struggled/failed) inserts a 3-day catch-up before the ladder continues; only
a clean solve advances.

The lock is enforced in Postgres, not the UI: the `checkpoints` table has no
write policies, and the only write paths are security-definer functions
(`complete_checkpoint`, `undo_checkpoint`, and the ladder-generating trigger).
`complete_checkpoint` rejects anything that isn't the due, unlocked rung.
All dates are pinned to Pacific/Auckland — "today" means NZ today, whether
the code runs on my laptop or a UTC Vercel server.

## One-time Supabase setup

1. Create a free project at [supabase.com](https://supabase.com).
2. **Schema:** open the SQL Editor and run the three files in order —
   [`supabase/schema.sql`](supabase/schema.sql), then
   [`supabase/v2-checkpoints.sql`](supabase/v2-checkpoints.sql), then
   [`supabase/v4-photos-undo.sql`](supabase/v4-photos-undo.sql). (Schema
   changes are hand-run numbered files, no migration tooling.)
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
- **Daily reminder** (`.github/workflows/daily-reminder.yml`) — the 5pm NZ
  email described above. Needs:
  - `SUPABASE_SECRET_KEY` — Project Settings → API → **secret key**
    (`sb_secret_…`). Service-role: it bypasses RLS to read due rows, which is
    why it lives only in GitHub's secret store, never in the app.
  - `RESEND_API_KEY` — free account at [resend.com](https://resend.com) → API key.
  - `REMINDER_EMAIL` — where to send it.

After adding secrets, run each workflow once by hand (Actions → Run workflow)
to confirm it works.
