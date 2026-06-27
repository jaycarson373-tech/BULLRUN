import { config } from "@/lib/config";
import { RACE_DURATION_MS } from "@/lib/time";
import type { Bull, Race, Season } from "@/types/domain";

const TOTAL_REGULAR_SEASON_RACES = 82;
const DEMO_CURRENT_RACE = 12;
const UNIQUE_RACE_STRIDES = [5, 7, 9] as const;

export function getSeasonStart(now = new Date()): Date {
  if (config.seasonStartIso) {
    return new Date(config.seasonStartIso);
  }

  return new Date(now.getTime() - (DEMO_CURRENT_RACE - 1) * RACE_DURATION_MS - 22 * 60 * 1000);
}

export function generateSeasonSchedule(bulls: Bull[], seasonStart = getSeasonStart()): Race[] {
  const ids = bulls.map((bull) => bull.id);

  return Array.from({ length: TOTAL_REGULAR_SEASON_RACES }, (_, index) => {
    const raceNumber = index + 1;
    const first = (index * 7) % ids.length;
    const stride = UNIQUE_RACE_STRIDES[index % UNIQUE_RACE_STRIDES.length];
    const bullIds = [0, 1, 2, 3].map((slot) => ids[(first + slot * stride) % ids.length]) as [
      string,
      string,
      string,
      string,
    ];
    const start = new Date(seasonStart.getTime() + index * RACE_DURATION_MS);
    const end = new Date(start.getTime() + RACE_DURATION_MS);

    return {
      id: `season-1-race-${raceNumber}`,
      season: 1,
      raceNumber,
      bullIds,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      snapshotStart: null,
      snapshotEnd: null,
      liveMarketCaps: null,
      winner: null,
      status: "scheduled",
      distributionComplete: false,
    };
  });
}

export function createInitialSeason(now = new Date()): Season {
  return {
    id: "season-1",
    currentRace: DEMO_CURRENT_RACE,
    currentWeek: Math.ceil(DEMO_CURRENT_RACE / 4),
    playoffsStarted: false,
    finalsStarted: false,
    seasonComplete: false,
    paused: false,
    championshipVaultSol: 0,
    totalDistributedSol: 0,
    lastDistributionAt: null,
    updatedAt: now.toISOString(),
  };
}
