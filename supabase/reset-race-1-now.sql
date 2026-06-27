do $$
declare
  launch_start timestamptz := '2026-06-27T21:00:00.000Z';
begin
  delete from public.distributions;

  update public.bulls
  set
    wins = 0,
    losses = 0,
    races = 0,
    total_percent_gain = 0,
    average_finish = 0;

  update public.races
  set
    start_time = launch_start + ((race_number - 1) * interval '90 minutes'),
    end_time = launch_start + (race_number * interval '90 minutes'),
    snapshot_start = null,
    snapshot_end = null,
    live_market_caps = null,
    winner = null,
    status = case when race_number = 1 then 'live' else 'scheduled' end,
    distribution_complete = false,
    updated_at = now();

  update public.seasons
  set
    current_race = 1,
    current_week = 1,
    playoffs_started = false,
    finals_started = false,
    season_complete = false,
    paused = false,
    championship_vault_sol = 0,
    total_distributed_sol = 0,
    last_distribution_at = null,
    updated_at = now()
  where id = 'season-1';

  insert into public.system_logs (level, message, metadata)
  values (
    'warn',
    'Race 1 forced live until 6:30 PM Toronto',
    jsonb_build_object(
      'race_1_start', launch_start,
      'race_1_end', launch_start + interval '90 minutes',
      'forced_at', now()
    )
  );
end $$;
