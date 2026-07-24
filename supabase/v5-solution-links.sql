-- ============================================================
-- v5: GitHub solution links for the initial solve and each review
-- Run ONCE in the Supabase SQL editor, after v4-photos-undo.sql.
-- ============================================================

-- The initial solve's code link lives on the question. Questions have a plain
-- owner RLS policy, so the app writes this column directly (via the edit form).
alter table public.questions add column solution_url text;

-- Each completed review can carry its own code link. Checkpoints are the
-- guarded state machine (no write RLS), so this column is only ever written
-- through the security-definer setter below.
alter table public.checkpoints add column solution_url text;

-- Attach (or clear) a code link on a completed review. The only checkpoint
-- write path besides complete/undo — links can be added long after the review,
-- so this is deliberately independent of the completion flow.
create function public.set_checkpoint_solution(p_id uuid, p_url text) returns void
language plpgsql security definer set search_path = public as $$
declare
  cp checkpoints%rowtype;
begin
  select * into cp from checkpoints
    where id = p_id and user_id = auth.uid()
    for update;

  if not found then
    raise exception 'checkpoint not found';
  end if;
  if cp.status <> 'done' then
    raise exception 'a solution link can only be attached to a completed review';
  end if;

  update checkpoints
     set solution_url = nullif(btrim(p_url), '')
   where id = cp.id;
end $$;

revoke execute on function public.set_checkpoint_solution(uuid, text) from public, anon;
grant execute on function public.set_checkpoint_solution(uuid, text) to authenticated;
