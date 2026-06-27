export type RaceStatus = "scheduled" | "live" | "completed" | "paused";

export type TxStatus = "queued" | "ready" | "complete" | "failed";

export type LogLevel = "info" | "warn" | "error";

export type RaceSnapshot = Record<string, MarketCapSnapshot>;

export interface Bull {
  id: string;
  name: string;
  ticker: string;
  tokenMint: string;
  image: string;
  feeWallet: string;
  wins: number;
  losses: number;
  races: number;
  totalPercentGain: number;
  averageFinish: number;
  seasonRank: number;
}

export interface MarketCapSnapshot {
  marketCap: number;
  recordedAt: string;
  percentChange?: number;
}

export interface Race {
  id: string;
  season: number;
  raceNumber: number;
  bullIds: [string, string, string, string];
  startTime: string;
  endTime: string;
  snapshotStart: RaceSnapshot | null;
  snapshotEnd: RaceSnapshot | null;
  liveMarketCaps: RaceSnapshot | null;
  winner: string | null;
  status: RaceStatus;
  distributionComplete: boolean;
  updatedAt?: string;
}

export interface Distribution {
  id: string;
  raceId: string;
  winningBull: string;
  winnerAmount: number;
  holderAmount: number;
  championshipAmount: number;
  txStatus: TxStatus;
  readyAt: string;
  createdAt: string;
  completedAt: string | null;
}

export interface Season {
  id: string;
  currentRace: number;
  currentWeek: number;
  playoffsStarted: boolean;
  finalsStarted: boolean;
  seasonComplete: boolean;
  paused: boolean;
  championshipVaultSol: number;
  totalDistributedSol: number;
  lastDistributionAt: string | null;
  updatedAt?: string;
}

export interface SystemLog {
  id: string;
  level: LogLevel;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface Standing extends Bull {
  points: number;
  averageGain: number;
}

export interface RaceCompetitorView {
  bull: Bull;
  startMarketCap: number | null;
  currentMarketCap: number;
  percentChange: number;
  position: number;
}

export interface CurrentRaceView {
  race: Race | null;
  status: RaceStatus | "offseason";
  competitors: RaceCompetitorView[];
  countdownMs: number;
  elapsedMs: number;
  totalRaceMs: number;
  serverTime: string;
}

export interface UpcomingRaceView {
  race: Race;
  bulls: Bull[];
  startsInMs: number;
}

export interface RaceHistoryView {
  race: Race;
  bulls: Bull[];
  winner: Bull | null;
  winnerPercentGain: number | null;
}

export interface DistributionSummary {
  championshipVaultSol: number;
  totalDistributedSol: number;
  lastDistribution: Distribution | null;
}

export interface DashboardData {
  currentRace: CurrentRaceView;
  standings: Standing[];
  upcomingRaces: UpcomingRaceView[];
  raceHistory: RaceHistoryView[];
  distributionSummary: DistributionSummary;
}
