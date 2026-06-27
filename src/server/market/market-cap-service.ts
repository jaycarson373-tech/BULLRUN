import { config } from "@/lib/config";
import { percentChange, round } from "@/lib/math";
import type { Bull, Race, RaceSnapshot } from "@/types/domain";

type ProviderPayload = {
  data?: Record<string, number | { marketCap?: number; market_cap?: number }>;
};

function hash(input: string): number {
  let value = 0;
  for (let index = 0; index < input.length; index += 1) {
    value = (value << 5) - value + input.charCodeAt(index);
    value |= 0;
  }

  return Math.abs(value);
}

function mockMarketCap(bull: Bull, at: Date, race?: Race): number {
  const seed = hash(`${bull.id}-${race?.raceNumber ?? 0}`);
  const base = 320_000 + (seed % 880_000);
  const raceStart = race ? new Date(race.startTime).getTime() : at.getTime();
  const elapsedMinutes = Math.max(0, (at.getTime() - raceStart) / 60000);
  const trend = Math.sin(elapsedMinutes / 11 + seed / 9000) * 0.09;
  const momentum = Math.cos(elapsedMinutes / 23 + seed / 12000) * 0.045;
  const leaderBias = ((seed % 17) - 8) / 100;

  return Math.max(50_000, round(base * (1 + trend + momentum + leaderBias), 2));
}

async function fetchProviderMarketCaps(bulls: Bull[]): Promise<Record<string, number> | null> {
  if (!config.marketCapApiUrl) {
    return null;
  }

  const url = new URL(config.marketCapApiUrl);
  url.searchParams.set("mints", bulls.map((bull) => bull.tokenMint).join(","));

  const response = await fetch(url, {
    headers: config.marketCapApiKey ? { authorization: `Bearer ${config.marketCapApiKey}` } : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Market cap provider failed with ${response.status}`);
  }

  const payload = (await response.json()) as ProviderPayload;
  const source = payload.data ?? {};
  const result: Record<string, number> = {};

  for (const bull of bulls) {
    const value = source[bull.tokenMint] ?? source[bull.id];
    if (typeof value === "number") {
      result[bull.id] = value;
    } else if (value && typeof value === "object") {
      result[bull.id] = Number(value.marketCap ?? value.market_cap ?? 0);
    }
  }

  return result;
}

export async function getMarketCapSnapshot(
  bulls: Bull[],
  race?: Race,
  at = new Date(),
): Promise<RaceSnapshot> {
  const providerCaps = await fetchProviderMarketCaps(bulls).catch(() => null);
  const snapshot: RaceSnapshot = {};

  for (const bull of bulls) {
    snapshot[bull.id] = {
      marketCap: round(providerCaps?.[bull.id] ?? mockMarketCap(bull, at, race), 2),
      recordedAt: at.toISOString(),
    };
  }

  return snapshot;
}

export function addPercentChanges(start: RaceSnapshot | null, current: RaceSnapshot): RaceSnapshot {
  const next: RaceSnapshot = {};

  for (const [bullId, snapshot] of Object.entries(current)) {
    const startCap = start?.[bullId]?.marketCap ?? snapshot.marketCap;
    next[bullId] = {
      ...snapshot,
      percentChange: percentChange(startCap, snapshot.marketCap),
    };
  }

  return next;
}

export function getWinnerFromSnapshots(start: RaceSnapshot, end: RaceSnapshot): string | null {
  let winner: string | null = null;
  let bestGain = Number.NEGATIVE_INFINITY;

  for (const bullId of Object.keys(end)) {
    const gain = percentChange(start[bullId]?.marketCap ?? 0, end[bullId].marketCap);
    if (gain > bestGain) {
      bestGain = gain;
      winner = bullId;
    }
  }

  return winner;
}
