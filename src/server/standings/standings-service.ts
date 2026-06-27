import { percentChange, round } from "@/lib/math";
import type { Bull, Race, Standing } from "@/types/domain";

import type { BullrunRepository } from "../repositories/types";

export function calculateStandings(bulls: Bull[]): Standing[] {
  return [...bulls]
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.totalPercentGain !== a.totalPercentGain) return b.totalPercentGain - a.totalPercentGain;
      return a.averageFinish - b.averageFinish;
    })
    .map((bull, index) => {
      const averageGain = bull.races > 0 ? bull.totalPercentGain / bull.races : 0;

      return {
        ...bull,
        seasonRank: index + 1,
        averageGain: round(averageGain, 2),
        points: Math.max(0, Math.round(bull.wins * 3 + averageGain / 10)),
      };
    });
}

export async function persistRankings(repo: BullrunRepository, standings: Standing[]): Promise<void> {
  for (const standing of standings) {
    await repo.upsertBull({
      ...standing,
      seasonRank: standing.seasonRank,
    });
  }
}

function buildResetBull(bull: Bull): Bull {
  return {
    ...bull,
    wins: 0,
    losses: 0,
    races: 0,
    totalPercentGain: 0,
    averageFinish: 0,
  };
}

export async function applyCompletedRaceToStandings(repo: BullrunRepository, race: Race): Promise<void> {
  if (!race.snapshotStart || !race.snapshotEnd || !race.winner) {
    return;
  }

  const bulls = await repo.getBulls();
  const raceBullIds = new Set(race.bullIds);
  const finishOrder = [...race.bullIds].sort((left, right) => {
    if (left === race.winner) return -1;
    if (right === race.winner) return 1;

    const leftGain = percentChange(race.snapshotStart?.[left]?.marketCap ?? 0, race.snapshotEnd?.[left]?.marketCap ?? 0);
    const rightGain = percentChange(
      race.snapshotStart?.[right]?.marketCap ?? 0,
      race.snapshotEnd?.[right]?.marketCap ?? 0,
    );
    return rightGain - leftGain;
  });

  for (const bull of bulls) {
    if (!raceBullIds.has(bull.id)) {
      continue;
    }

    const finish = finishOrder.indexOf(bull.id) + 1;
    const gain = percentChange(race.snapshotStart[bull.id]?.marketCap ?? 0, race.snapshotEnd[bull.id]?.marketCap ?? 0);
    const nextRaces = bull.races + 1;

    await repo.upsertBull({
      ...bull,
      wins: bull.id === race.winner ? bull.wins + 1 : bull.wins,
      losses: bull.id === race.winner ? bull.losses : bull.losses + 1,
      races: nextRaces,
      totalPercentGain: round(bull.totalPercentGain + gain, 2),
      averageFinish: round((bull.averageFinish * bull.races + finish) / nextRaces, 2),
    });
  }

  await persistRankings(repo, calculateStandings(await repo.getBulls()));
}

export async function recalculateStandingsFromHistory(repo: BullrunRepository): Promise<void> {
  const bulls = (await repo.getBulls()).map(buildResetBull);
  for (const bull of bulls) {
    await repo.upsertBull(bull);
  }

  const completed = (await repo.getRaces())
    .filter((race) => race.status === "completed" && race.snapshotStart && race.snapshotEnd && race.winner)
    .sort((a, b) => a.raceNumber - b.raceNumber);

  for (const race of completed) {
    await applyCompletedRaceToStandings(repo, race);
  }
}
