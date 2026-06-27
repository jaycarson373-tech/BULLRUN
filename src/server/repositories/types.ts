import type { Bull, Distribution, Season, SystemLog, Race } from "@/types/domain";

export interface BullrunRepository {
  getBulls(): Promise<Bull[]>;
  getBull(id: string): Promise<Bull | null>;
  upsertBull(bull: Bull): Promise<void>;
  getRaces(): Promise<Race[]>;
  getRace(id: string): Promise<Race | null>;
  upsertRace(race: Race): Promise<void>;
  getDistributions(): Promise<Distribution[]>;
  getDistribution(id: string): Promise<Distribution | null>;
  upsertDistribution(distribution: Distribution): Promise<void>;
  getSeason(): Promise<Season>;
  updateSeason(season: Season): Promise<void>;
  getLogs(limit?: number): Promise<SystemLog[]>;
  appendLog(level: SystemLog["level"], message: string, metadata?: Record<string, unknown>): Promise<void>;
}
