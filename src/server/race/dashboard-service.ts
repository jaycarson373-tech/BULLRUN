import { config } from "@/lib/config";
import { clamp, percentChange } from "@/lib/math";
import { RACE_DURATION_MS } from "@/lib/time";
import type {
  Bull,
  CurrentRaceView,
  DashboardData,
  Race,
  RaceCompetitorView,
  RaceHistoryView,
  UpcomingRaceView,
} from "@/types/domain";

import { getDistributionSummary } from "../distributions/distribution-service";
import { addPercentChanges, getMarketCapSnapshot } from "../market/market-cap-service";
import { getRepository } from "../repositories/repository";
import type { BullrunRepository } from "../repositories/types";
import { runRaceEngineTick } from "./race-engine";
import { calculateStandings } from "../standings/standings-service";

function mapBulls(bulls: Bull[]): Map<string, Bull> {
  return new Map(bulls.map((bull) => [bull.id, bull]));
}

async function maybeAutoTick(repo: BullrunRepository): Promise<void> {
  if (config.apiEnableAutoTick) {
    await runRaceEngineTick({ repo, source: "api" });
  }
}

function isInsideRaceWindow(race: Race, now: Date): boolean {
  const start = new Date(race.startTime);
  const end = new Date(race.endTime);
  return start <= now && end > now;
}

function competitorsForRace(race: Race, bulls: Bull[], currentSnapshot = race.liveMarketCaps): RaceCompetitorView[] {
  const byId = mapBulls(bulls);
  const snapshotWithChanges = currentSnapshot ? addPercentChanges(race.snapshotStart, currentSnapshot) : null;
  const marketCaps = race.bullIds.map((id) => snapshotWithChanges?.[id]?.marketCap ?? 0);
  const minMarketCap = Math.min(...marketCaps, 0);
  const maxMarketCap = Math.max(...marketCaps, 1);
  const spread = Math.max(1, maxMarketCap - minMarketCap);

  return race.bullIds.map((id) => {
    const bull = byId.get(id);
    if (!bull) {
      throw new Error(`Bull ${id} not found`);
    }

    const current = snapshotWithChanges?.[id];
    const percent = current?.percentChange ?? 0;
    const currentMarketCap = current?.marketCap ?? 0;
    const normalized = clamp(((currentMarketCap - minMarketCap) / spread) * 76 + 12, 6, 94);

    return {
      bull,
      startMarketCap: race.snapshotStart?.[id]?.marketCap ?? null,
      currentMarketCap,
      percentChange: percent,
      position: normalized,
    };
  });
}

export async function getCurrentRaceView(repo = getRepository()): Promise<CurrentRaceView> {
  await maybeAutoTick(repo);

  const now = new Date();
  const bulls = await repo.getBulls();
  const races = await repo.getRaces();
  const active =
    races.find((race) => isInsideRaceWindow(race, now)) ??
    races.find((race) => race.status === "live") ??
    races.find((race) => race.status === "scheduled" && new Date(race.startTime) > now) ??
    races.at(-1) ??
    null;

  if (!active) {
    return {
      race: null,
      status: "offseason",
      competitors: [],
      countdownMs: 0,
      elapsedMs: 0,
      totalRaceMs: RACE_DURATION_MS,
      serverTime: now.toISOString(),
    };
  }

  const start = new Date(active.startTime).getTime();
  const end = new Date(active.endTime).getTime();
  const displayStatus = isInsideRaceWindow(active, now) ? "live" : active.status;
  let currentSnapshot = active.liveMarketCaps;
  if (displayStatus === "live") {
    currentSnapshot = await getMarketCapSnapshot(
      active.bullIds
        .map((id) => bulls.find((bull) => bull.id === id))
        .filter(Boolean) as Bull[],
      active,
      now,
    );
  }

  const elapsedMs = clamp(now.getTime() - start, 0, RACE_DURATION_MS);

  return {
    race: active,
    status: displayStatus,
    competitors: competitorsForRace(active, bulls, currentSnapshot),
    countdownMs: displayStatus === "live" ? Math.max(0, end - now.getTime()) : Math.max(0, start - now.getTime()),
    elapsedMs,
    totalRaceMs: RACE_DURATION_MS,
    serverTime: now.toISOString(),
  };
}

export async function getUpcomingRaces(limit = 10, repo = getRepository()): Promise<UpcomingRaceView[]> {
  await maybeAutoTick(repo);

  const now = new Date();
  const bullsById = mapBulls(await repo.getBulls());

  return (await repo.getRaces())
    .filter((race) => new Date(race.startTime) > now)
    .sort((a, b) => a.raceNumber - b.raceNumber)
    .slice(0, limit)
    .map((race) => ({
      race,
      bulls: race.bullIds.map((id) => bullsById.get(id)).filter(Boolean) as Bull[],
      startsInMs: new Date(race.startTime).getTime() - now.getTime(),
    }));
}

export async function getRaceHistory(limit = 10, repo = getRepository()): Promise<RaceHistoryView[]> {
  await maybeAutoTick(repo);

  const bullsById = mapBulls(await repo.getBulls());

  return (await repo.getRaces())
    .filter((race) => race.status === "completed")
    .sort((a, b) => b.raceNumber - a.raceNumber)
    .slice(0, limit)
    .map((race) => {
      const winner = race.winner ? bullsById.get(race.winner) ?? null : null;
      const winnerPercentGain =
        race.winner && race.snapshotStart && race.snapshotEnd
          ? percentChange(race.snapshotStart[race.winner]?.marketCap ?? 0, race.snapshotEnd[race.winner]?.marketCap ?? 0)
          : null;

      return {
        race,
        bulls: race.bullIds.map((id) => bullsById.get(id)).filter(Boolean) as Bull[],
        winner,
        winnerPercentGain,
      };
    });
}

export async function getDashboardData(repo = getRepository()): Promise<DashboardData> {
  await maybeAutoTick(repo);

  const bulls = await repo.getBulls();
  const [currentRace, upcomingRaces, raceHistory, distributionSummary] = await Promise.all([
    getCurrentRaceView(repo),
    getUpcomingRaces(10, repo),
    getRaceHistory(8, repo),
    getDistributionSummary(repo),
  ]);

  return {
    currentRace,
    standings: calculateStandings(bulls),
    upcomingRaces,
    raceHistory,
    distributionSummary,
  };
}
