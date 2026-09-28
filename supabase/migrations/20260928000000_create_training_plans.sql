-- 20260928000000_create_training_plans.sql
-- Training plans table: stores AI-generated and user-created multi-week programs

create table public.training_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  description text not null check (char_length(description) <= 500),
  category text not null check (category in ('Strength', 'Running', 'Mobility', 'Cardio', 'Mixed')),
  difficulty text not null check (difficulty in ('Beginner', 'Intermediate', 'Advanced')),
  duration_weeks integer not null check (duration_weeks between 1 and 52),
  sessions_per_week integer not null check (sessions_per_week between 1 and 14),
  target_outcome text, -- e.g. "Build strength", "Run 5K", "Improve mobility"
  is_ai_generated boolean not null default false,
  plan_template jsonb, -- stores the week-by-week structure for AI-generated plans
  status text not null default 'active' check (status in ('active', 'completed', 'paused')),
  current_week integer not null default 1 check (current_week between 1 and 52),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index training_plans_user_idx
  on public.training_plans (user_id, status, created_at desc);

alter table public.training_plans enable row level security;

create policy "Users can read their own training plans"
  on public.training_plans for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own training plans"
  on public.training_plans for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own training plans"
  on public.training_plans for update to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can delete their own training plans"
  on public.training_plans for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Plan sessions: individual workouts within a plan
create table public.plan_sessions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.training_plans (id) on delete cascade,
  week_number integer not null check (week_number between 1 and 52),
  session_number integer not null check (session_number between 1 and 14),
  title text not null check (char_length(title) between 1 and 100),
  description text check (char_length(description) <= 500),
  category text not null check (category in ('Strength', 'Running', 'Mobility', 'Cardio', 'Mixed')),
  duration_minutes integer not null check (duration_minutes between 5 and 180),
  exercises jsonb, -- array of exercise objects with name, sets, reps, etc.
  order_index integer not null default 0,
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index plan_sessions_plan_idx
  on public.plan_sessions (plan_id, week_number, session_number, order_index);

alter table public.plan_sessions enable row level security;

create policy "Users can read plan sessions via their plans"
  on public.plan_sessions for select to authenticated
  using (
    exists (
      select 1 from public.training_plans
      where id = plan_id and user_id = auth.uid()
    )
  );

create policy "Users can insert plan sessions via their plans"
  on public.plan_sessions for insert to authenticated
  with check (
    exists (
      select 1 from public.training_plans
      where id = plan_id and user_id = auth.uid()
    )
  );

create policy "Users can update plan sessions via their plans"
  on public.plan_sessions for update to authenticated
  using (
    exists (
      select 1 from public.training_plans
      where id = plan_id and user_id = auth.uid()
    )
  );

create policy "Users can delete plan sessions via their plans"
  on public.plan_sessions for delete to authenticated
  using (
    exists (
      select 1 from public.training_plans
      where id = plan_id and user_id = auth.uid()
    )
  );

-- Function to calculate plan progress percentage
create or replace function public.calculate_plan_progress(plan_id_param uuid)
returns integer as $$
declare
  total_sessions integer;
  completed_sessions integer;
begin
  select count(*) into total_sessions
  from public.plan_sessions
  where plan_id = plan_id_param;

  select count(*) into completed_sessions
  from public.plan_sessions
  where plan_id = plan_id_param and is_completed = true;

  if total_sessions = 0 then
    return 0;
  end if;

  return round((completed_sessions::numeric / total_sessions) * 100);
end;
$$ language plpgsql security definer;

-- Grant execute permission
grant execute on function public.calculate_plan_progress(uuid) to authenticated;
