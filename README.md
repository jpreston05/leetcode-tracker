# Leetcode Tracker

Tracking leetcode problems to hold myself accountable.

A private, single-user app: log solved LeetCode problems, attach photos of
handwritten notes, and get told what to re-solve today via 5-box Leitner
spaced repetition.

**Stack:** Next.js (App Router, TypeScript) · Supabase (Postgres, Storage, Auth) · Tailwind

## One-time Supabase setup

1. Create a free project at [supabase.com](https://supabase.com).
2. **Schema:** open SQL Editor, paste and run [`supabase/schema.sql`](supabase/schema.sql)
   (creates `questions`, `reviews`, RLS policies, and the private `note-photos` bucket).
3. **GitHub OAuth:**
   - GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.
     - Homepage URL: `http://localhost:3000` (add your prod URL later)
     - Callback URL: `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
   - Supabase → Authentication → Providers → GitHub: enable, paste Client ID + Secret.
4. **Env vars:** copy `.env.example` to `.env.local`, fill in the URL and anon key
   from Project Settings → API.
5. Run the app, sign in once with your GitHub account, **then** lock the door:
   Supabase → Authentication → Settings → disable **"Allow new users to sign up"**.
   Your existing user keeps working; nobody else can ever register.

## Develop

```bash
npm install
npm run dev   # http://localhost:3000
```

## Keep-warm (do this once the repo is on GitHub)

Supabase free projects pause after 7 idle days. `.github/workflows/keep-warm.yml`
pings the REST API every 3 days to prevent that. Add two **repository secrets**
(GitHub → repo → Settings → Secrets and variables → Actions):

- `SUPABASE_URL` — e.g. `https://YOUR-PROJECT-REF.supabase.co`
- `SUPABASE_ANON_KEY` — the anon key (public by design, but a secret keeps it out of logs)

Then run the workflow once by hand (Actions → Keep Supabase warm → Run workflow)
to confirm a 200.

## Deploy (Vercel)

1. [vercel.com](https://vercel.com) → Add New Project → import this repo (defaults are fine).
2. Add the two env vars from `.env.example` in Project Settings → Environment Variables.
3. After the first deploy, tell Supabase about the prod URL:
   Authentication → URL Configuration → set Site URL to your Vercel URL and add
   `https://YOUR-APP.vercel.app/auth/callback` to Redirect URLs.

## v4 upgrade: photos, undo, reminders

1. **Schema**: run [`supabase/v4-photos-undo.sql`](supabase/v4-photos-undo.sql)
   once in the SQL editor (after v2). Adds multi-photo support (`note_photos`)
   and the same-day `undo_checkpoint` function.
2. **Daily email reminder** (`.github/workflows/daily-reminder.yml`, 5pm NZ,
   sends only when reviews are due). Add repo secrets:
   - `SUPABASE_SECRET_KEY` — Project Settings → API → **secret key**
     (`sb_secret_…`). Service-role: it bypasses RLS to count due rows, which is
     why it lives only in GitHub's secret store, never in the app.
   - `RESEND_API_KEY` — free account at [resend.com](https://resend.com) → API key.
   - `REMINDER_EMAIL` — where to send it.
   Then Actions → "Daily review reminder" → Run workflow to test.

## How review scheduling works (v2: checkpoint ladders)

Every problem gets a 7-rung ladder: 1 day → 3 days → 1 week → 2 weeks →
1 month → 3 months → 6 months. Rungs unlock one at a time, and scheduling is
**completion-anchored**: finishing rung N today puts rung N+1 at today + its
interval, so being late never compresses the rest of the schedule. A review
that goes badly (struggled/failed) inserts a 3-day catch-up before the ladder
continues; only a clean solve advances. Completing all 7 rungs graduates the
problem.

The lock is enforced in Postgres, not the UI: the `checkpoints` table has no
write policies, and the only write path is the `complete_checkpoint` function,
which rejects anything that isn't the due, unlocked rung.

**v2 upgrade of an existing v1 project:** run
[`supabase/v2-checkpoints.sql`](supabase/v2-checkpoints.sql) once in the SQL
editor (after `schema.sql`). It creates `checkpoints` + the `activity_daily`
heatmap view, builds ladders for existing questions, and drops the v1
`reviews` table and Leitner columns.
