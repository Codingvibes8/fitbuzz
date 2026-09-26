create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  category text not null check (category in ('Strength', 'Running', 'Mobility', 'Cardio')),
  duration integer not null check (duration between 1 and 600),
  volume integer not null default 0 check (volume between 0 and 100000),
  workout_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index workouts_user_date_idx
  on public.workouts (user_id, workout_date desc, created_at desc);

alter table public.workouts enable row level security;

create policy "Users can read their own workouts"
  on public.workouts for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own workouts"
  on public.workouts for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own workouts"
  on public.workouts for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own workouts"
  on public.workouts for delete to authenticated
  using ((select auth.uid()) = user_id);