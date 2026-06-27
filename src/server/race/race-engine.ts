import { RACE_DURATION_MS } from "@/lib/time";
import type { Bull, Race, Season } from "@/types/domain";

import { queueDistribution, markReadyDistributions, recalculateSeasonTreasury } from "../distributions/distribution-service";
import { getMarketCapSnapshot, getWinnerFromSnapshots } from "../market/market-cap-service";
import { attachPayoutPlanToDistribution, executeReadyDistributions } from "../payouts/payout-service";
import { getRepository } from "../repositories/repository";
import type { BullrunRepository } from "../repositories/types";
import { applyCompletedRaceToStandings } from "../standings/standings-service";

function bullsForRace(race: Race, bulls: Bull[]): Bull[] {
  const byId = new Map(bulls.map((bull) => [bull.id, bull]));
  return race.bullIds.map((id) => byId.get(id)).filter(Boolean) as Bull[];
}

function currentRaceNumber(races: Race[], now: Date): number {
  const live = races.find((race) => new Date(race.startTime) <= now && new Date(race.endTime) > now);
  if (live) {
    return live.raceNumber;
  }

  const upcoming = races.find((race) => new Date(race.startTime) > now);
  return upcoming?.raceNumber ?? races.at(-1)?.raceNumber ?? 1;
}

function deriveWeek(raceNumber: number): number {
  return Math.ceil(raceNumber / 4);
}

async function startRace(repo: BullrunRepository, race: Race, bulls: Bull[], now: Date): Promise<Race> {
  const snapshotStart = race.snapshotStart ?? (await getMarketCapSnapshot(bulls, race, new Date(race.startTime)));
  const liveMarketCaps = await getMarketCapSnapshot(bulls, race, now);
  const next: Race = {
    ...race,
    snapshotStart,
    liveMarketCaps,
    status: "live",
  };

  await repo.upsertRace(next);
  await repo.appendLog("info", "Race started", { raceId: race.id, raceNumber: race.raceNumber });
  return next;
}

async function updateLiveRace(repo: BullrunRepository, race: Race, bulls: Bull[], now: Date): Promise<Race> {
  const next: Race = {
    ...race,
    liveMarketCaps: await getMarketCapSnapshot(bulls, race, now),
    status: "live",
  };

  await repo.upsertRace(next);
  return next;
}

async function completeRace(repo: BullrunRepository, race: Race, bulls: Bull[], completedAt: Date): Promise<Race> {
  const snapshotStart = race.snapshotStart ?? (await getMarketCapSnapshot(bulls, race, new Date(race.startTime)));
  const snapshotEnd = race.snapshotEnd ?? (await getMarketCapSnapshot(bulls, race, completedAt));
  const winner = race.winner ?? getWinnerFromSnapshots(snapshotStart, snapshotEnd);
  const next: Race = {
    ...race,
    snapshotStart,
    snapshotEnd,
    liveMarketCaps: snapshotEnd,
    winner,
    status: "completed",
  };

  await repo.upsertRace(next);
  await applyCompletedRaceToStandings(repo, next);
  await queueDistribution(repo, next, completedAt);
  const distribution = await repo.getDistribution(`distribution-${race.id}`);
  if (distribution && !distribution.payoutPlan) {
    await repo.upsertDistribution(await attachPayoutPlanToDistribution(repo, next, distribution));
  }
  await repo.appendLog("info", "Race completed", { raceId: race.id, raceNumber: race.raceNumber, winner });
  return next;
}

async function syncSeason(repo: BullrunRepository, season: Season, races: Race[], now: Date): Promise<void> {
  const distributions = await repo.getDistributions();
  const raceNumber = currentRaceNumber(races, now);
  const nextSeason = recalculateSeasonTreasury(
    {
      ...season,
      currentRace: raceNumber,
      currentWeek: deriveWeek(raceNumber),
      seasonComplete: races.every((race) => race.status === "completed"),
    },
    distributions,
  );

  await repo.updateSeason(nextSeason);
}

export async function runRaceEngineTick(options: { now?: Date; repo?: BullrunRepository; source?: string } = {}): Promise<void> {
  const repo = options.repo ?? getRepository();
  const now = options.now ?? new Date();
  const season = await repo.getSeason();

  if (season.paused || season.seasonComplete) {
    await markReadyDistributions(repo, now);
    await executeReadyDistributions(repo);
    await syncSeason(repo, season, await repo.getRaces(), now);
    return;
  }

  const bulls = await repo.getBulls();
  const races = await repo.getRaces();
  const sorted = [...races].sort((a, b) => a.raceNumber - b.raceNumber);

  for (const race of sorted) {
    const start = new Date(race.startTime);
    const end = new Date(race.endTime);
    const raceBulls = bullsForRace(race, bulls);

    if (race.status === "completed" || race.status === "paused") {
      continue;
    }

    if (now >= end) {
      await completeRace(repo, race, raceBulls, end);
      continue;
    }

    if (now >= start && now < end) {
      if (race.status === "scheduled") {
        await startRace(repo, race, raceBulls, now);
      } else {
        const lastRecorded = race.liveMarketCaps?.[race.bullIds[0]]?.recordedAt;
        const shouldRefresh = !lastRecorded || now.getTime() - new Date(lastRecorded).getTime() >= 30_000;
        if (shouldRefresh) {
          await updateLiveRace(repo, race, raceBulls, now);
        }
      }
    }
  }

  await markReadyDistributions(repo, now);
  await executeReadyDistributions(repo);
  await syncSeason(repo, await repo.getSeason(), await repo.getRaces(), now);

  if (options.source === "worker") {
    await repo.appendLog("info", "Race engine tick complete", {
      source: options.source,
      raceDurationMs: RACE_DURATION_MS,
      checkedAt: now.toISOString(),
    });
  }
}

export async function forceCompleteNextRace(repo = getRepository(), now = new Date()): Promise<void> {
  const bulls = await repo.getBulls();
  const races = await repo.getRaces();
  const target =
    races.find((race) => race.status === "live") ??
    races.find((race) => race.status === "scheduled" && new Date(race.startTime) <= now) ??
    races.find((race) => race.status === "scheduled");

  if (!target) {
    throw new Error("No race available to advance");
  }

  await completeRace(repo, target, bullsForRace(target, bulls), now);
  await markReadyDistributions(repo, now);
  await executeReadyDistributions(repo);
  await syncSeason(repo, await repo.getSeason(), await repo.getRaces(), now);
  await repo.appendLog("warn", "Race manually advanced", { raceId: target.id, raceNumber: target.raceNumber });
}
