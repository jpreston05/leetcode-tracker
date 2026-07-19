-- ============================================================
-- v4: multiple note photos per question + same-day review undo
-- Run ONCE in the Supabase SQL editor, after v2-checkpoints.sql.
-- ============================================================

-- NOTE PHOTOS: many per question. Unlike checkpoints, plain owner RLS is
-- enough — uploads are not a guarded state machine.
create table public.note_photos (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  user_id     uuid not null default auth.uid() references auth.users (id),
  path        text not null,          -- storage object path in note-photos bucket
  created_at  timestamptz not null default now()
);

create index note_photos_question_idx on public.note_photos (question_id);

alter table public.note_photos enable row level security;
create policy "owner all" on public.note_photos
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- migrate the single v3 photo (if any) into the new table, then drop the column
insert into public.note_photos (question_id, user_id, path, created_at)
select id, user_id, photo_path, created_at
from public.questions
where photo_path is not null;

alter table public.questions drop column photo_path;

-- UNDO a mis-tapped review. Same-day only, and by construction a question can
-- complete at most one checkpoint per day (whatever a completion unlocks is
-- never due the same day), so this checkpoint is necessarily the latest one.
create function public.undo_checkpoint(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  cp checkpoints%rowtype;
  today date := nz_today();
begin
  select * into cp from checkpoints
    where id = p_id and user_id = auth.uid()
    for update;

  if not found then
    raise exception 'checkpoint not found';
  end if;
  if cp.status <> 'done' then
    raise exception 'checkpoint is not completed';
  end if;
  if cp.completed_date <> today then
    raise exception 'only today''s reviews can be undone';
  end if;

  if cp.outcome <> 'clean' then
    -- remove the catch-up this completion spawned
    delete from checkpoints c
     where c.question_id = cp.question_id
       and c.is_catchup
       and c.status <> 'done'
       and c.sequence = cp.sequence
       and c.due_date = cp.completed_date + 3;
  else
    -- re-lock the rung this completion unlocked
    update checkpoints c
       set due_date = null, status = 'locked'
     where c.question_id = cp.question_id
       and c.sequence = cp.sequence + 1
       and not c.is_catchup
       and c.status <> 'done';
  end if;

  update checkpoints
     set completed_date = null,
         outcome = null,
         status = case when due_date <= today then 'available' else 'locked' end
   where id = cp.id;
end $$;

revoke execute on function public.undo_checkpoint(uuid) from public, anon;
grant execute on function public.undo_checkpoint(uuid) to authenticated;
