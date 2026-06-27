alter table public.races
  add column if not exists winning_bull_pot_sol numeric not null default 0,
  add column if not exists bullrun_holder_pot_sol numeric not null default 0,
  add column if not exists championship_pot_sol numeric not null default 0;

alter table public.distributions
  add column if not exists winning_bull_pot_sol numeric not null default 0,
  add column if not exists bullrun_holder_pot_sol numeric not null default 0,
  add column if not exists championship_pot_sol numeric not null default 0;

update public.distributions
set
  winning_bull_pot_sol = winner_amount,
  bullrun_holder_pot_sol = holder_amount,
  championship_pot_sol = championship_amount
where
  winning_bull_pot_sol = 0
  and bullrun_holder_pot_sol = 0
  and championship_pot_sol = 0;

update public.races as race
set
  winning_bull_pot_sol = distribution.winning_bull_pot_sol,
  bullrun_holder_pot_sol = distribution.bullrun_holder_pot_sol,
  championship_pot_sol = distribution.championship_pot_sol
from public.distributions as distribution
where
  distribution.race_id = race.id
  and race.winning_bull_pot_sol = 0
  and race.bullrun_holder_pot_sol = 0
  and race.championship_pot_sol = 0;
