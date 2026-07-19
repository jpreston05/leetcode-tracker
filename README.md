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

## How review scheduling works

Every problem sits in a Leitner box 1–5 with intervals 1 / 3 / 7 / 14 / 30 days.
Review it cleanly → up a box. Struggle or fail → back to box 1. A problem is
"due" when its `next_review_date` is today or earlier. Each attempt is appended
to `reviews` — history is never overwritten.
