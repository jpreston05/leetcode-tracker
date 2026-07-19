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

## How review scheduling works

Every problem sits in a Leitner box 1–5 with intervals 1 / 3 / 7 / 14 / 30 days.
Review it cleanly → up a box. Struggle or fail → back to box 1. A problem is
"due" when its `next_review_date` is today or earlier. Each attempt is appended
to `reviews` — history is never overwritten.
