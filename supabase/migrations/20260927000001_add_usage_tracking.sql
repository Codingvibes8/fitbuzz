-- Add API usage tracking columns to subscriptions table
alter table public.subscriptions
  add column if not exists api_calls_used int not null default 0,
  add column if not exists api_calls_reset_date timestamptz not null default (now() + interval '1 month');

-- Create index for efficient quota checking
create index if not exists idx_subscriptions_api_reset_date
  on public.subscriptions (api_calls_reset_date)
  where api_calls_used > 0;