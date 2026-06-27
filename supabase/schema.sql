create extension if not exists pgcrypto;

create table if not exists public.bulls (
  id text primary key,
  name text not null,
  ticker text not null,
  token_mint text not null,
  image text,
  fee_wallet text not null,
  wins integer not null default 0,
  losses integer not null default 0,
  races integer not null default 0,
  total_percent_gain numeric not null default 0,
  average_finish numeric not null default 0,
  season_rank integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.races (
  id text primary key,
  season integer not null default 1,
  race_number integer not null unique,
  bull1 text not null references public.bulls(id),
  bull2 text not null references public.bulls(id),
  bull3 text not null references public.bulls(id),
  bull4 text not null references public.bulls(id),
  start_time timestamptz not null,
  end_time timestamptz not null,
  snapshot_start jsonb,
  snapshot_end jsonb,
  live_market_caps jsonb,
  winner text references public.bulls(id),
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'completed', 'paused')),
  distribution_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint race_has_four_unique_bulls check (
    bull1 <> bull2 and bull1 <> bull3 and bull1 <> bull4 and bull2 <> bull3 and bull2 <> bull4 and bull3 <> bull4
  ),
  constraint race_duration_90_minutes check (end_time = start_time + interval '90 minutes')
);

create table if not exists public.distributions (
  id text primary key,
  race_id text not null references public.races(id) on delete cascade,
  winning_bull text not null references public.bulls(id),
  winner_amount numeric not null default 0,
  holder_amount numeric not null default 0,
  championship_amount numeric not null default 0,
  tx_status text not null default 'queued' check (tx_status in ('queued', 'ready', 'complete', 'failed')),
  ready_at timestamptz not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.seasons (
  id text primary key,
  current_race integer not null default 1,
  current_week integer not null default 1,
  playoffs_started boolean not null default false,
  finals_started boolean not null default false,
  season_complete boolean not null default false,
  paused boolean not null default false,
  championship_vault_sol numeric not null default 0,
  total_distributed_sol numeric not null default 0,
  last_distribution_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.system_logs (
  id uuid primary key default gen_random_uuid(),
  level text not null check (level in ('info', 'warn', 'error')),
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists races_status_idx on public.races(status);
create index if not exists races_start_time_idx on public.races(start_time);
create index if not exists distributions_status_idx on public.distributions(tx_status);
create index if not exists system_logs_created_at_idx on public.system_logs(created_at desc);

alter table public.bulls enable row level security;
alter table public.races enable row level security;
alter table public.distributions enable row level security;
alter table public.seasons enable row level security;
alter table public.system_logs enable row level security;
