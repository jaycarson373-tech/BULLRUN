import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Bull, Distribution, Race, Season, SystemLog } from "@/types/domain";

import type { BullrunRepository } from "./types";

type BullRow = {
  id: string;
  name: string;
  ticker: string;
  token_mint: string;
  image: string | null;
  fee_wallet: string;
  wins: number;
  losses: number;
  races: number;
  total_percent_gain: number;
  average_finish: number;
  season_rank: number;
};

type RaceRow = {
  id: string;
  season: number;
  race_number: number;
  bull1: string;
  bull2: string;
  bull3: string;
  bull4: string;
  start_time: string;
  end_time: string;
  snapshot_start: Race["snapshotStart"];
  snapshot_end: Race["snapshotEnd"];
  live_market_caps: Race["liveMarketCaps"];
  winner: string | null;
  status: Race["status"];
  distribution_complete: boolean;
  winning_bull_pot_sol?: number | null;
  bullrun_holder_pot_sol?: number | null;
  championship_pot_sol?: number | null;
  updated_at: string | null;
};

type DistributionRow = {
  id: string;
  race_id: string;
  winning_bull: string;
  winner_amount: number;
  holder_amount: number;
  championship_amount: number;
  winning_bull_pot_sol?: number | null;
  bullrun_holder_pot_sol?: number | null;
  championship_pot_sol?: number | null;
  tx_status: Distribution["txStatus"];
  ready_at: string;
  created_at: string;
  completed_at: string | null;
  payout_plan: Distribution["payoutPlan"];
  tx_signatures: string[] | null;
  failed_reason: string | null;
};

type SeasonRow = {
  id: string;
  current_race: number;
  current_week: number;
  playoffs_started: boolean;
  finals_started: boolean;
  season_complete: boolean;
  paused: boolean;
  championship_vault_sol: number;
  total_distributed_sol: number;
  last_distribution_at: string | null;
  updated_at: string | null;
};

type LogRow = {
  id: string;
  level: SystemLog["level"];
  message: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function toBull(row: BullRow): Bull {
  return {
    id: row.id,
    name: row.name,
    ticker: row.ticker,
    tokenMint: row.token_mint,
    image: row.image ?? "",
    feeWallet: row.fee_wallet,
    wins: row.wins,
    losses: row.losses,
    races: row.races,
    totalPercentGain: row.total_percent_gain,
    averageFinish: row.average_finish,
    seasonRank: row.season_rank,
  };
}

function fromBull(bull: Bull): BullRow {
  return {
    id: bull.id,
    name: bull.name,
    ticker: bull.ticker,
    token_mint: bull.tokenMint,
    image: bull.image,
    fee_wallet: bull.feeWallet,
    wins: bull.wins,
    losses: bull.losses,
    races: bull.races,
    total_percent_gain: bull.totalPercentGain,
    average_finish: bull.averageFinish,
    season_rank: bull.seasonRank,
  };
}

function toRace(row: RaceRow): Race {
  return {
    id: row.id,
    season: row.season,
    raceNumber: row.race_number,
    bullIds: [row.bull1, row.bull2, row.bull3, row.bull4],
    startTime: row.start_time,
    endTime: row.end_time,
    snapshotStart: row.snapshot_start,
    snapshotEnd: row.snapshot_end,
    liveMarketCaps: row.live_market_caps,
    winner: row.winner,
    status: row.status,
    distributionComplete: row.distribution_complete,
    winningBullPotSol: Number(row.winning_bull_pot_sol ?? 0),
    bullrunHolderPotSol: Number(row.bullrun_holder_pot_sol ?? 0),
    championshipPotSol: Number(row.championship_pot_sol ?? 0),
    updatedAt: row.updated_at ?? undefined,
  };
}

function fromRace(race: Race, includePotColumns = true): RaceRow {
  const row: RaceRow = {
    id: race.id,
    season: race.season,
    race_number: race.raceNumber,
    bull1: race.bullIds[0],
    bull2: race.bullIds[1],
    bull3: race.bullIds[2],
    bull4: race.bullIds[3],
    start_time: race.startTime,
    end_time: race.endTime,
    snapshot_start: race.snapshotStart,
    snapshot_end: race.snapshotEnd,
    live_market_caps: race.liveMarketCaps,
    winner: race.winner,
    status: race.status,
    distribution_complete: race.distributionComplete,
    updated_at: new Date().toISOString(),
  };

  if (includePotColumns) {
    row.winning_bull_pot_sol = race.winningBullPotSol;
    row.bullrun_holder_pot_sol = race.bullrunHolderPotSol;
    row.championship_pot_sol = race.championshipPotSol;
  }

  return row;
}

function toDistribution(row: DistributionRow): Distribution {
  return {
    id: row.id,
    raceId: row.race_id,
    winningBull: row.winning_bull,
    winnerAmount: row.winner_amount,
    holderAmount: row.holder_amount,
    championshipAmount: row.championship_amount,
    winningBullPotSol: Number(row.winning_bull_pot_sol ?? row.winner_amount ?? 0),
    bullrunHolderPotSol: Number(row.bullrun_holder_pot_sol ?? row.holder_amount ?? 0),
    championshipPotSol: Number(row.championship_pot_sol ?? row.championship_amount ?? 0),
    txStatus: row.tx_status,
    readyAt: row.ready_at,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    payoutPlan: row.payout_plan,
    txSignatures: row.tx_signatures ?? [],
    failedReason: row.failed_reason,
  };
}

function fromDistribution(distribution: Distribution, includePotColumns = true): DistributionRow {
  const row: DistributionRow = {
    id: distribution.id,
    race_id: distribution.raceId,
    winning_bull: distribution.winningBull,
    winner_amount: distribution.winnerAmount,
    holder_amount: distribution.holderAmount,
    championship_amount: distribution.championshipAmount,
    tx_status: distribution.txStatus,
    ready_at: distribution.readyAt,
    created_at: distribution.createdAt,
    completed_at: distribution.completedAt,
    payout_plan: distribution.payoutPlan,
    tx_signatures: distribution.txSignatures,
    failed_reason: distribution.failedReason,
  };

  if (includePotColumns) {
    row.winning_bull_pot_sol = distribution.winningBullPotSol;
    row.bullrun_holder_pot_sol = distribution.bullrunHolderPotSol;
    row.championship_pot_sol = distribution.championshipPotSol;
  }

  return row;
}

function toSeason(row: SeasonRow): Season {
  return {
    id: row.id,
    currentRace: row.current_race,
    currentWeek: row.current_week,
    playoffsStarted: row.playoffs_started,
    finalsStarted: row.finals_started,
    seasonComplete: row.season_complete,
    paused: row.paused,
    championshipVaultSol: row.championship_vault_sol,
    totalDistributedSol: row.total_distributed_sol,
    lastDistributionAt: row.last_distribution_at,
    updatedAt: row.updated_at ?? undefined,
  };
}

function fromSeason(season: Season): SeasonRow {
  return {
    id: season.id,
    current_race: season.currentRace,
    current_week: season.currentWeek,
    playoffs_started: season.playoffsStarted,
    finals_started: season.finalsStarted,
    season_complete: season.seasonComplete,
    paused: season.paused,
    championship_vault_sol: season.championshipVaultSol,
    total_distributed_sol: season.totalDistributedSol,
    last_distribution_at: season.lastDistributionAt,
    updated_at: new Date().toISOString(),
  };
}

function toLog(row: LogRow): SystemLog {
  return {
    id: row.id,
    level: row.level,
    message: row.message,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

async function throwIfError<T>(response: { data: T; error: { message: string } | null }): Promise<T> {
  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.data;
}

function isMissingPotColumnError(message: string): boolean {
  return (
    message.includes("winning_bull_pot_sol") ||
    message.includes("bullrun_holder_pot_sol") ||
    message.includes("championship_pot_sol")
  );
}

export class SupabaseRepository implements BullrunRepository {
  private readonly client = getSupabaseAdmin();
  private racePotColumnsAvailable = true;
  private distributionPotColumnsAvailable = true;

  async getBulls(): Promise<Bull[]> {
    const rows = await throwIfError(await this.client.from("bulls").select("*").order("season_rank"));
    return (rows as BullRow[]).map(toBull);
  }

  async getBull(id: string): Promise<Bull | null> {
    const row = await throwIfError(await this.client.from("bulls").select("*").eq("id", id).maybeSingle());
    return row ? toBull(row as BullRow) : null;
  }

  async upsertBull(bull: Bull): Promise<void> {
    await throwIfError(await this.client.from("bulls").upsert(fromBull(bull)));
  }

  async getRaces(): Promise<Race[]> {
    const rows = await throwIfError(await this.client.from("races").select("*").order("race_number"));
    return (rows as RaceRow[]).map(toRace);
  }

  async getRace(id: string): Promise<Race | null> {
    const row = await throwIfError(await this.client.from("races").select("*").eq("id", id).maybeSingle());
    return row ? toRace(row as RaceRow) : null;
  }

  async upsertRace(race: Race): Promise<void> {
    const response = await this.client.from("races").upsert(fromRace(race, this.racePotColumnsAvailable));
    if (response.error && isMissingPotColumnError(response.error.message)) {
      this.racePotColumnsAvailable = false;
      await throwIfError(await this.client.from("races").upsert(fromRace(race, false)));
      return;
    }

    await throwIfError(response);
  }

  async getDistributions(): Promise<Distribution[]> {
    const rows = await throwIfError(
      await this.client.from("distributions").select("*").order("created_at", { ascending: false }),
    );
    return (rows as DistributionRow[]).map(toDistribution);
  }

  async getDistribution(id: string): Promise<Distribution | null> {
    const row = await throwIfError(await this.client.from("distributions").select("*").eq("id", id).maybeSingle());
    return row ? toDistribution(row as DistributionRow) : null;
  }

  async upsertDistribution(distribution: Distribution): Promise<void> {
    const response = await this.client
      .from("distributions")
      .upsert(fromDistribution(distribution, this.distributionPotColumnsAvailable));
    if (response.error && isMissingPotColumnError(response.error.message)) {
      this.distributionPotColumnsAvailable = false;
      await throwIfError(await this.client.from("distributions").upsert(fromDistribution(distribution, false)));
      return;
    }

    await throwIfError(response);
  }

  async getSeason(): Promise<Season> {
    const row = await throwIfError(await this.client.from("seasons").select("*").eq("id", "season-1").maybeSingle());
    if (!row) {
      throw new Error("No active season found. Run npm run seed.");
    }

    return toSeason(row as SeasonRow);
  }

  async updateSeason(season: Season): Promise<void> {
    await throwIfError(await this.client.from("seasons").upsert(fromSeason(season)));
  }

  async getLogs(limit = 100): Promise<SystemLog[]> {
    const rows = await throwIfError(
      await this.client.from("system_logs").select("*").order("created_at", { ascending: false }).limit(limit),
    );
    return (rows as LogRow[]).map(toLog);
  }

  async appendLog(
    level: SystemLog["level"],
    message: string,
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    await throwIfError(
      await this.client.from("system_logs").insert({
        level,
        message,
        metadata,
      }),
    );
  }
}
