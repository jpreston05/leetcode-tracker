-- ============================================================
-- v7: adaptive review queue replaces the fixed 7-rung ladder
-- Run ONCE in the Supabase SQL editor, after v6-public-portfolio.sql.
-- Non-destructive: existing questions/checkpoints rows are only read, never
-- changed or deleted. Wrapped in a transaction: if any statement fails,
-- nothing is applied.
-- ============================================================

begin;
--
-- New model: every solve or review is an ATTEMPT. A question's schedule
-- (interval_days, next_due, retired_on) is DERIVED by replaying its attempts
-- (plus defer/unretire events) through src/lib/schedule.ts. The app writes
-- the derived values back after every change, so these columns are a cache.
-- Never patch them by hand. NULL interval_days means "not computed yet", and
-- the owner dashboard fills those in on load (that is how this migration's
-- rows get scheduled: this file only copies history, it does no scheduling).
--
-- The old checkpoints table is kept untouched as a read-only archive and
-- will be dropped in a later file.

-- ---------- attempts ----------
create table public.attempts (
  id            uuid primary key default gen_random_uuid(),
  question_id   uuid not null references public.questions (id) on delete cascade,
  user_id       uuid not null default auth.uid() references auth.users (id),
  attempted_on  date not null,
  minutes       integer check (minutes > 0),          -- null only on migrated rows
  grade         text check (grade in ('clean', 'shaky', 'failed')), -- null only on migrated initial solves
  solution_url  text,
  notes         text,
  created_at    timestamptz not null default now()
);

create index attempts_question_idx on public.attempts (question_id, attempted_on, created_at);

alter table public.attempts enable row level security;
create policy "owner all" on public.attempts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- schedule events (defer / unretire) ----------
-- Stored rather than applied in place, so replaying history reproduces them.
create table public.schedule_events (
  id           uuid primary key default gen_random_uuid(),
  question_id  uuid not null references public.questions (id) on delete cascade,
  user_id      uuid not null default auth.uid() references auth.users (id),
  kind         text not null check (kind in ('defer', 'unretire')),
  event_date   date not null,
  created_at   timestamptz not null default now()
);

create index schedule_events_question_idx on public.schedule_events (question_id, event_date, created_at);

alter table public.schedule_events enable row level security;
create policy "owner all" on public.schedule_events
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- derived schedule cache on questions ----------
alter table public.questions
  add column interval_days integer,
  add column next_due      date,
  add column retired_on    date;

create index questions_next_due_idx on public.questions (next_due) where retired_on is null;

-- ---------- shut down the ladder ----------
drop trigger questions_generate_ladder on public.questions;
revoke execute on function public.complete_checkpoint(uuid, text)     from authenticated;
revoke execute on function public.undo_checkpoint(uuid)               from authenticated;
revoke execute on function public.set_checkpoint_solution(uuid, text) from authenticated;

-- ---------- migrate history ----------
-- The initial solve of every question (grade/minutes unknown).
insert into public.attempts (question_id, user_id, attempted_on, created_at)
select id, user_id, date_solved, created_at
from public.questions;

-- Every completed rung or catch-up becomes a review attempt.
insert into public.attempts (question_id, user_id, attempted_on, grade, solution_url, created_at)
select question_id, user_id, completed_date,
       case outcome when 'struggled' then 'shaky' else outcome end,
       solution_url, created_at
from public.checkpoints
where status = 'done' and completed_date is not null;

-- ---------- views ----------
-- Activity: the first attempt per question is the solve, the rest are reviews.
-- Same column shape as before, so the daily reminder keeps working.
create or replace view public.activity_daily
with (security_invoker = true) as
select attempted_on as day,
       count(*) filter (where seq = 1) as solved,
       count(*) filter (where seq > 1) as reviewed,
       count(*)                        as total
from (
  select attempted_on,
         row_number() over (partition by question_id order by attempted_on, created_at) as seq
  from public.attempts
) a
group by attempted_on;

create or replace view public.public_activity
with (security_invoker = false) as
select attempted_on as day,
       count(*) filter (where seq = 1) as solved,
       count(*) filter (where seq > 1) as reviewed,
       count(*)                        as total
from (
  select attempted_on,
         row_number() over (partition by question_id order by attempted_on, created_at) as seq
  from public.attempts
) a
group by attempted_on;

-- Public questions gain a retired flag (status only, not the date).
create or replace view public.public_questions
with (security_invoker = false) as
select id, leetcode_number, title, url, difficulty, topic, solution_url, date_solved,
       retired_on is not null as retired
from public.questions;

-- Public attempts: order + grade + link only. No dates, minutes, or notes.
create view public.public_attempts
with (security_invoker = false) as
select question_id,
       row_number() over (partition by question_id order by attempted_on, created_at) as seq,
       grade,
       solution_url
from public.attempts;

drop view public.public_checkpoints;

grant select on public.public_attempts to anon, authenticated;

commit;
