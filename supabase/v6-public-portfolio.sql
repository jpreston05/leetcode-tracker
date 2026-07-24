-- ============================================================
-- v6: public read-only portfolio views
-- Run ONCE in the Supabase SQL editor, after v5-solution-links.sql.
-- ============================================================
--
-- The base tables are owner-only (RLS: user_id = auth.uid()), so an anonymous
-- visitor can read nothing. To let recruiters see progress + solution links
-- without touching that lock, we expose a curated subset through views.
--
-- These views are security_invoker = FALSE (the default, stated for intent):
-- they run with the view owner's rights (postgres, which owns the tables and
-- is exempt from their RLS), so anon can read them. That is the opposite of
-- activity_daily (v2), which is security_invoker = true precisely so it stays
-- owner-scoped. The safety here is COLUMN-level: each view lists only
-- public-safe columns, so private notes, confidence, photo paths, and the
-- review schedule (due/completed dates) never leave the database.
--
-- Single-user app (signups disabled), so the view bodies need no user_id
-- filter. If this ever became multi-user, these would have to scope to a
-- chosen public profile.

-- Questions: portfolio-safe columns only.
-- Excludes user_id, confidence, notes, created_at.
create view public.public_questions
with (security_invoker = false) as
select id, leetcode_number, title, url, difficulty, topic, solution_url, date_solved
from public.questions;

-- Checkpoints: ladder progress + per-review solve links, no schedule.
-- Excludes due_date, completed_date, interval_days, interval_label.
create view public.public_checkpoints
with (security_invoker = false) as
select question_id, sequence, is_catchup, status, outcome, solution_url
from public.checkpoints;

-- Activity: same shape as activity_daily, but definer so anon can read it
-- for the public heatmap.
create view public.public_activity
with (security_invoker = false) as
select day,
       count(*) filter (where kind = 'solved') as solved,
       count(*) filter (where kind = 'review') as reviewed,
       count(*)                                as total
from (
  select date_solved as day, 'solved' as kind from public.questions
  union all
  select completed_date, 'review' from public.checkpoints
   where status = 'done' and completed_date is not null
) events
group by day;

grant select on public.public_questions   to anon, authenticated;
grant select on public.public_checkpoints  to anon, authenticated;
grant select on public.public_activity     to anon, authenticated;
