import { round } from "@/lib/math";
import { seedBulls } from "@/server/seed/bulls";
import { createInitialSeason, generateSeasonSchedule } from "@/server/seed/schedule";
import type { Bull, Distribution, Race, Season, SystemLog } from "@/types/domain";

import type { BullrunRepository } from "./types";

interface MemoryState {
  bulls: Bull[];
  races: Race[];
  distributions: Distribution[];
  season: Season;
  logs: SystemLog[];
}

declare global {
  var __bullrunMemoryState: MemoryState | undefined;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function createState(): MemoryState {
  const now = new Date();
  const bulls = clone(seedBulls);
  const races = generateSeasonSchedule(bulls);

  return {
    bulls,
    races,
    distributions: [],
    season: createInitialSeason(now),
    logs: [
      {
        id: `log-${now.getTime()}`,
        level: "info",
        message: "Local seed repository initialized",
        metadata: { mode: "memory" },
        createdAt: now.toISOString(),
      },
    ],
  };
}

function getState(): MemoryState {
  if (!globalThis.__bullrunMemoryState) {
    globalThis.__bullrunMemoryState = createState();
  }

  return globalThis.__bullrunMemoryState;
}

export class MemoryRepository implements BullrunRepository {
  async getBulls(): Promise<Bull[]> {
    return clone(getState().bulls).sort((a, b) => a.seasonRank - b.seasonRank);
  }

  async getBull(id: string): Promise<Bull | null> {
    const bull = getState().bulls.find((item) => item.id === id);
    return bull ? clone(bull) : null;
  }

  async upsertBull(bull: Bull): Promise<void> {
    const state = getState();
    const index = state.bulls.findIndex((item) => item.id === bull.id);
    const next = { ...bull, totalPercentGain: round(bull.totalPercentGain), averageFinish: round(bull.averageFinish) };

    if (index >= 0) {
      state.bulls[index] = clone(next);
    } else {
      state.bulls.push(clone(next));
    }
  }

  async getRaces(): Promise<Race[]> {
    return clone(getState().races).sort((a, b) => a.raceNumber - b.raceNumber);
  }

  async getRace(id: string): Promise<Race | null> {
    const race = getState().races.find((item) => item.id === id);
    return race ? clone(race) : null;
  }

  async upsertRace(race: Race): Promise<void> {
    const state = getState();
    const index = state.races.findIndex((item) => item.id === race.id);
    const next = { ...race, updatedAt: new Date().toISOString() };

    if (index >= 0) {
      state.races[index] = clone(next);
    } else {
      state.races.push(clone(next));
    }
  }

  async getDistributions(): Promise<Distribution[]> {
    return clone(getState().distributions).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getDistribution(id: string): Promise<Distribution | null> {
    const distribution = getState().distributions.find((item) => item.id === id);
    return distribution ? clone(distribution) : null;
  }

  async upsertDistribution(distribution: Distribution): Promise<void> {
    const state = getState();
    const index = state.distributions.findIndex((item) => item.id === distribution.id);

    if (index >= 0) {
      state.distributions[index] = clone(distribution);
    } else {
      state.distributions.push(clone(distribution));
    }
  }

  async getSeason(): Promise<Season> {
    return clone(getState().season);
  }

  async updateSeason(season: Season): Promise<void> {
    getState().season = clone({ ...season, updatedAt: new Date().toISOString() });
  }

  async getLogs(limit = 100): Promise<SystemLog[]> {
    return clone(getState().logs)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  async appendLog(
    level: SystemLog["level"],
    message: string,
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    const now = new Date();
    getState().logs.push({
      id: `log-${now.getTime()}-${Math.random().toString(16).slice(2)}`,
      level,
      message,
      metadata,
      createdAt: now.toISOString(),
    });
  }
}
