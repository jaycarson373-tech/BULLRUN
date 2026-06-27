alter table public.distributions
  add column if not exists payout_plan jsonb,
  add column if not exists tx_signatures jsonb not null default '[]'::jsonb,
  add column if not exists failed_reason text;
