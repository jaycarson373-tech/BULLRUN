import { config } from "@/lib/config";
import { round, sum } from "@/lib/math";
import type { Distribution, DistributionSummary, Race, Season } from "@/types/domain";

import type { BullrunRepository } from "../repositories/types";

export function createDistributionForRace(race: Race, now = new Date()): Distribution | null {
  if (!race.winner) {
    return null;
  }

  const total = Math.max(0, config.defaultCreatorFeeSol);

  return {
    id: `distribution-${race.id}`,
    raceId: race.id,
    winningBull: race.winner,
    winnerAmount: round(total * 0.5, 4),
    holderAmount: round(total * 0.25, 4),
    championshipAmount: round(total * 0.25, 4),
    txStatus: "queued",
    readyAt: new Date(now.getTime() + 5 * 60 * 1000).toISOString(),
    createdAt: now.toISOString(),
    completedAt: null,
  };
}

export async function queueDistribution(repo: BullrunRepository, race: Race, now = new Date()): Promise<void> {
  const existing = await repo.getDistribution(`distribution-${race.id}`);
  if (existing) {
    return;
  }

  const distribution = createDistributionForRace(race, now);
  if (!distribution) {
    return;
  }

  await repo.upsertDistribution(distribution);
  await repo.appendLog("info", "Distribution queued", {
    raceId: race.id,
    winningBull: race.winner,
    readyAt: distribution.readyAt,
  });
}

export async function markReadyDistributions(repo: BullrunRepository, now = new Date()): Promise<void> {
  const distributions = await repo.getDistributions();

  for (const distribution of distributions) {
    if (distribution.txStatus === "queued" && new Date(distribution.readyAt) <= now) {
      await repo.upsertDistribution({ ...distribution, txStatus: "ready" });
      await repo.appendLog("info", "Distribution ready for execution", { distributionId: distribution.id });
    }
  }
}

export async function markDistributionComplete(repo: BullrunRepository, distributionId: string): Promise<void> {
  const distribution = await repo.getDistribution(distributionId);
  if (!distribution) {
    throw new Error("Distribution not found");
  }

  const completedAt = new Date().toISOString();
  const race = await repo.getRace(distribution.raceId);
  const season = await repo.getSeason();

  await repo.upsertDistribution({
    ...distribution,
    txStatus: "complete",
    completedAt,
  });

  if (race) {
    await repo.upsertRace({ ...race, distributionComplete: true });
  }

  await repo.updateSeason(recalculateSeasonTreasury(season, await repo.getDistributions()));
  await repo.appendLog("info", "Distribution marked complete", { distributionId });
}

export function recalculateSeasonTreasury(season: Season, distributions: Distribution[]): Season {
  const completed = distributions.filter((distribution) => distribution.txStatus === "complete");
  const last = completed.sort((a, b) => b.completedAt?.localeCompare(a.completedAt ?? "") ?? 0)[0] ?? null;

  return {
    ...season,
    championshipVaultSol: round(sum(distributions.map((distribution) => distribution.championshipAmount)), 4),
    totalDistributedSol: round(sum(completed.map((distribution) => distribution.winnerAmount + distribution.holderAmount)), 4),
    lastDistributionAt: last?.completedAt ?? season.lastDistributionAt,
  };
}

export async function getDistributionSummary(repo: BullrunRepository): Promise<DistributionSummary> {
  const season = await repo.getSeason();
  const distributions = await repo.getDistributions();
  const lastDistribution = distributions.find((distribution) => distribution.txStatus === "complete") ?? distributions[0] ?? null;
  const treasury = recalculateSeasonTreasury(season, distributions);

  return {
    championshipVaultSol: treasury.championshipVaultSol,
    totalDistributedSol: treasury.totalDistributedSol,
    lastDistribution,
  };
}
