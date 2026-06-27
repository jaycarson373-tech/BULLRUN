import { z } from "zod";

import { nowIso } from "@/lib/time";
import type { Bull, Race } from "@/types/domain";

import { markDistributionComplete } from "../distributions/distribution-service";
import { getRepository } from "../repositories/repository";
import type { BullrunRepository } from "../repositories/types";
import { forceCompleteNextRace, runRaceEngineTick } from "../race/race-engine";
import { recalculateStandingsFromHistory } from "../standings/standings-service";

export const bullUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  ticker: z.string().min(1).max(12).optional(),
  tokenMint: z.string().min(1).optional(),
  image: z.string().optional(),
  feeWallet: z.string().min(1).optional(),
});

export const raceUpdateSchema = z.object({
  bullIds: z.tuple([z.string(), z.string(), z.string(), z.string()]).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  status: z.enum(["scheduled", "live", "completed", "paused"]).optional(),
});

export const adminActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("pauseSeason") }),
  z.object({ action: z.literal("resumeSeason") }),
  z.object({ action: z.literal("advanceRace") }),
  z.object({ action: z.literal("overrideWinner"), raceId: z.string(), winner: z.string() }),
  z.object({ action: z.literal("markDistributionComplete"), distributionId: z.string() }),
]);

export async function getAdminState(repo = getRepository()) {
  const [bulls, races, distributions, season, logs] = await Promise.all([
    repo.getBulls(),
    repo.getRaces(),
    repo.getDistributions(),
    repo.getSeason(),
    repo.getLogs(80),
  ]);

  const currentIndex = Math.max(0, races.findIndex((race) => race.raceNumber >= season.currentRace));

  return {
    bulls,
    races: races.slice(Math.max(0, currentIndex - 5), currentIndex + 25),
    distributions: distributions.slice(0, 25),
    season,
    logs,
  };
}

export async function updateBull(id: string, payload: unknown, repo = getRepository()): Promise<Bull> {
  const update = bullUpdateSchema.parse(payload);
  const bull = await repo.getBull(id);

  if (!bull) {
    throw Object.assign(new Error("Bull not found"), { status: 404 });
  }

  const next: Bull = {
    ...bull,
    ...update,
    ticker: update.ticker ? update.ticker.toUpperCase() : bull.ticker,
  };

  await repo.upsertBull(next);
  await repo.appendLog("info", "Bull updated", { bullId: id });
  return next;
}

export async function updateRace(id: string, payload: unknown, repo = getRepository()): Promise<Race> {
  const update = raceUpdateSchema.parse(payload);
  const race = await repo.getRace(id);

  if (!race) {
    throw Object.assign(new Error("Race not found"), { status: 404 });
  }

  const next: Race = {
    ...race,
    ...update,
    updatedAt: nowIso(),
  };

  await repo.upsertRace(next);
  await repo.appendLog("info", "Race updated", { raceId: id });
  return next;
}

async function pauseSeason(repo: BullrunRepository): Promise<void> {
  const season = await repo.getSeason();
  await repo.updateSeason({ ...season, paused: true });
  await repo.appendLog("warn", "Season paused");
}

async function resumeSeason(repo: BullrunRepository): Promise<void> {
  const season = await repo.getSeason();
  await repo.updateSeason({ ...season, paused: false });
  await repo.appendLog("info", "Season resumed");
  await runRaceEngineTick({ repo, source: "admin" });
}

async function advanceRace(repo: BullrunRepository): Promise<void> {
  await forceCompleteNextRace(repo, new Date());
}

async function overrideWinner(repo: BullrunRepository, raceId: string, winner: string): Promise<void> {
  const race = await repo.getRace(raceId);
  if (!race) {
    throw Object.assign(new Error("Race not found"), { status: 404 });
  }

  if (!race.bullIds.includes(winner)) {
    throw Object.assign(new Error("Winner must be one of the race bulls"), { status: 400 });
  }

  await repo.upsertRace({ ...race, winner, status: "completed" });
  await recalculateStandingsFromHistory(repo);
  await repo.appendLog("warn", "Winner overridden", { raceId, winner });
}

export async function performAdminAction(payload: unknown, repo = getRepository()): Promise<{ ok: true }> {
  const command = adminActionSchema.parse(payload);

  switch (command.action) {
    case "pauseSeason":
      await pauseSeason(repo);
      break;
    case "resumeSeason":
      await resumeSeason(repo);
      break;
    case "advanceRace":
      await advanceRace(repo);
      break;
    case "overrideWinner":
      await overrideWinner(repo, command.raceId, command.winner);
      break;
    case "markDistributionComplete":
      await markDistributionComplete(repo, command.distributionId);
      break;
  }

  return { ok: true };
}
