-- LeetCode Tracker schema
-- Run this once in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).

-- QUESTIONS: one row per LeetCode problem
create table public.questions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users (id),
  leetcode_number  integer not null unique check (leetcode_number > 0),
  title            text not null,
  url              text not null,
  difficulty       text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  topic            text not null,                -- e.g. 'two-pointers', 'DP', 'graphs'
  confidence       smallint not null check (confidence between 1 and 5),
  date_solved      date not null default current_date,
  leitner_box      smallint not null default 1 check (leitner_box between 1 and 5),
  next_review_date date not null,
  notes            text,
  photo_path       text,                         -- Supabase Storage object path (private bucket)
  created_at       timestamptz not null default now()
);

-- REVIEWS: append-only log, one row per attempt. Never updated or deleted by the app.
create table public.reviews (
  id                 uuid primary key default gen_random_uuid(),
  question_id        uuid not null references public.questions (id) on delete cascade,
  user_id            uuid not null default auth.uid() references auth.users (id),
  reviewed_on        date not null default current_date,
  outcome            text not null check (outcome in ('clean', 'struggled', 'failed')),
  time_taken_minutes integer check (time_taken_minutes > 0),
  created_at         timestamptz not null default now()
);

create index reviews_question_id_idx on public.reviews (question_id);
create index questions_next_review_idx on public.questions (next_review_date);

-- Row Level Security: owner-only access on both tables
alter table public.questions enable row level security;
alter table public.reviews enable row level security;

create policy "owner all" on public.questions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "owner all" on public.reviews
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- STORAGE: private bucket for note photos, objects stored under {user_id}/{question_id}.jpg
insert into storage.buckets (id, name, public) values ('note-photos', 'note-photos', false);

create policy "owner select" on storage.objects for select
  using (bucket_id = 'note-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "owner insert" on storage.objects for insert
  with check (bucket_id = 'note-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "owner update" on storage.objects for update
  using (bucket_id = 'note-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "owner delete" on storage.objects for delete
  using (bucket_id = 'note-photos' and (storage.foldername(name))[1] = auth.uid()::text);
