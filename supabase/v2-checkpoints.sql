-- ============================================================
-- v2: checkpoint ladders replace the flat reviews + Leitner box
-- Run this ONCE in the Supabase SQL editor, after v1 schema.sql.
-- ============================================================

-- CHECKPOINTS: one row per scheduled review. The 7 ladder rungs are created
-- up front per question; catch-up rows are inserted when a review goes badly.
create table public.checkpoints (
  id              uuid primary key default gen_random_uuid(),
  question_id     uuid not null references public.questions (id) on delete cascade,
  user_id         uuid not null references auth.users (id),
  sequence        smallint not null check (sequence between 1 and 7),
  is_catchup      boolean not null default false,
  interval_days   integer not null,
  interval_label  text not null,
  due_date        date,             -- null while locked: unknowable until the previous rung completes
  status          text not null default 'locked' check (status in ('locked', 'available', 'done')),
  completed_date  date,
  outcome         text check (outcome in ('clean', 'struggled', 'failed')),
  created_at      timestamptz not null default now()
);

-- one row per ladder rung; catch-ups share their rung's sequence, so exclude them
create unique index checkpoints_rung_uidx on public.checkpoints (question_id, sequence)
  where not is_catchup;
create index checkpoints_due_idx on public.checkpoints (due_date) where status <> 'done';

alter table public.checkpoints enable row level security;
create policy "owner read" on public.checkpoints for select using (user_id = auth.uid());
-- Deliberately NO insert/update/delete policies: every write goes through the
-- security-definer trigger/function below. The lock is enforced here, not in the UI.

-- The whole app runs on NZ days; Postgres current_date is UTC, which is up to
-- 13 hours behind the owner's wall clock.
create function public.nz_today() returns date
language sql stable as $$
  select (now() at time zone 'Pacific/Auckland')::date
$$;

-- Generate the 7-rung ladder whenever a question is created.
-- Rung 1 is due the day after solving; rungs 2-7 stay locked with no date
-- (completion-anchored: their dates aren't known until the previous rung is done).
create function public.generate_ladder() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into checkpoints (question_id, user_id, sequence, interval_days, interval_label, due_date, status)
  select new.id, new.user_id, t.seq, t.days, t.label,
         case when t.seq = 1 then new.date_solved + 1 end,
         case when t.seq = 1 and new.date_solved + 1 <= nz_today() then 'available' else 'locked' end
  from (values
      (1, 1,   '1 day'),
      (2, 3,   '3 days'),
      (3, 7,   '1 week'),
      (4, 14,  '2 weeks'),
      (5, 30,  '1 month'),
      (6, 90,  '3 months'),
      (7, 180, '6 months')
    ) as t(seq, days, label);
  return new;
end $$;

create trigger questions_generate_ladder
  after insert on public.questions
  for each row execute function public.generate_ladder();

-- Complete a checkpoint. This is the ONLY write path for reviews:
--  * rejects anything that isn't the due, unlocked rung (the server-side lock)
--  * clean       -> unlock the next rung, due = today + its interval
--  * struggled/
--    failed      -> insert a 3-day catch-up before the ladder continues
--                   (uniform rule: failing a catch-up spawns another catch-up)
create function public.complete_checkpoint(p_id uuid, p_outcome text) returns void
language plpgsql security definer set search_path = public as $$
declare
  cp checkpoints%rowtype;
  today date := nz_today();
begin
  if p_outcome not in ('clean', 'struggled', 'failed') then
    raise exception 'invalid outcome: %', p_outcome;
  end if;

  select * into cp from checkpoints
    where id = p_id and user_id = auth.uid()
    for update;

  if not found then
    raise exception 'checkpoint not found';
  end if;
  if cp.status = 'done' then
    raise exception 'checkpoint already completed';
  end if;
  if cp.due_date is null then
    raise exception 'checkpoint is locked: complete the previous review first';
  end if;
  if cp.due_date > today then
    raise exception 'checkpoint not due until %', cp.due_date;
  end if;

  update checkpoints
     set status = 'done', completed_date = today, outcome = p_outcome
   where id = cp.id;

  if p_outcome <> 'clean' then
    insert into checkpoints
      (question_id, user_id, sequence, is_catchup, interval_days, interval_label, due_date)
    values
      (cp.question_id, cp.user_id, cp.sequence, true, 3, '3-day catch-up', today + 3);
  else
    update checkpoints
       set due_date = today + interval_days
     where question_id = cp.question_id
       and sequence = cp.sequence + 1
       and not is_catchup
       and status <> 'done';
    -- no row when cp.sequence = 7: the question has graduated
  end if;
end $$;

revoke execute on function public.complete_checkpoint(uuid, text) from public, anon;
grant execute on function public.complete_checkpoint(uuid, text) to authenticated;

-- ---------- migrate existing v1 data ----------

-- Fresh ladders for questions created before this migration (no reviews were
-- ever logged, so there is no history to map).
insert into public.checkpoints (question_id, user_id, sequence, interval_days, interval_label, due_date, status)
select q.id, q.user_id, t.seq, t.days, t.label,
       case when t.seq = 1 then q.date_solved + 1 end,
       case when t.seq = 1 and q.date_solved + 1 <= nz_today() then 'available' else 'locked' end
from public.questions q
cross join (values
    (1, 1,   '1 day'),
    (2, 3,   '3 days'),
    (3, 7,   '1 week'),
    (4, 14,  '2 weeks'),
    (5, 30,  '1 month'),
    (6, 90,  '3 months'),
    (7, 180, '6 months')
  ) as t(seq, days, label)
where not exists (select 1 from public.checkpoints c where c.question_id = q.id);

-- v1 leftovers: reviews is empty (confirmed), and the Leitner columns are
-- superseded by the checkpoint ladder.
drop table public.reviews;
alter table public.questions
  drop column leitner_box,
  drop column next_review_date;

-- ---------- heatmap data source ----------

-- A VIEW, not a counter table: activity is derived data whose truth already
-- lives in questions/checkpoints. A view cannot drift out of sync and needs
-- no extra write paths; at single-user scale it is free to compute.
-- security_invoker makes the view run with the caller's rights, so the RLS
-- policies on the underlying tables still apply.
create view public.activity_daily
with (security_invoker = true) as
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

grant select on public.activity_daily to authenticated;
