import { config } from "@/lib/config";
import { percentChange, round } from "@/lib/math";
import type { Bull, Race, RaceSnapshot } from "@/types/domain";

type ProviderPayload = {
  data?: Record<string, ProviderMarketValue>;
};

type ProviderMarketValue =
  | number
  | {
      marketCap?: number | string;
      market_cap?: number | string;
      price?: number | string;
      priceUsd?: number | string;
      price_usd?: number | string;
    };

type HeliusTokenInfo = {
  supply?: number | string;
  decimals?: number | string;
  price_info?: {
    price_per_token?: number | string;
  };
};

type HeliusAssetPayload = {
  result?: {
    token_info?: HeliusTokenInfo;
  };
};

type DexScreenerPair = {
  chainId?: string;
  baseToken?: {
    address?: string;
  };
  priceUsd?: number | string;
  fdv?: number | string;
  marketCap?: number | string;
  liquidity?: {
    usd?: number | string;
  };
};

type DexScreenerPayload = {
  pairs?: DexScreenerPair[] | null;
};

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function configuredTokenSupply(): number | null {
  return Number.isFinite(config.tokenFixedSupply) && config.tokenFixedSupply > 0 ? config.tokenFixedSupply : null;
}

function marketCapFromPrice(price: unknown): number | null {
  const parsedPrice = toFiniteNumber(price);
  const supply = configuredTokenSupply();

  if (parsedPrice === null || parsedPrice <= 0 || supply === null) {
    return null;
  }

  return round(parsedPrice * supply, 2);
}

function marketCapFromTokenInfo(tokenInfo: HeliusTokenInfo | undefined): number | null {
  const price = tokenInfo?.price_info?.price_per_token;
  const fixedSupplyCap = marketCapFromPrice(price);

  if (fixedSupplyCap !== null) {
    return fixedSupplyCap;
  }

  const rawSupply = toFiniteNumber(tokenInfo?.supply);
  const decimals = toFiniteNumber(tokenInfo?.decimals) ?? 0;
  const parsedPrice = toFiniteNumber(price);

  if (rawSupply === null || parsedPrice === null || parsedPrice <= 0) {
    return null;
  }

  return round((rawSupply / 10 ** decimals) * parsedPrice, 2);
}

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

function getHeliusRpcUrl(): string | null {
  if (!config.heliusApiKey && !config.heliusRpcUrl) {
    return null;
  }

  const url = new URL(config.heliusRpcUrl ?? "https://mainnet.helius-rpc.com/");

  if (config.heliusApiKey && !url.searchParams.has("api-key")) {
    url.searchParams.set("api-key", config.heliusApiKey);
  }

  return url.toString();
}

async function fetchHeliusMarketCap(bull: Bull, rpcUrl: string): Promise<number | null> {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: `bullrun-${bull.id}`,
      method: "getAsset",
      params: { id: bull.tokenMint },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Helius market cap lookup failed with ${response.status}`);
  }

  const payload = (await response.json()) as HeliusAssetPayload;
  return marketCapFromTokenInfo(payload.result?.token_info);
}

async function fetchHeliusMarketCaps(bulls: Bull[]): Promise<Record<string, number> | null> {
  const rpcUrl = getHeliusRpcUrl();

  if (!rpcUrl) {
    return null;
  }

  const entries = await Promise.all(
    bulls.map(async (bull) => [bull.id, await fetchHeliusMarketCap(bull, rpcUrl).catch(() => null)] as const),
  );
  const result: Record<string, number> = {};

  for (const [bullId, marketCap] of entries) {
    if (marketCap !== null) {
      result[bullId] = marketCap;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

function extractDexScreenerMarketCap(pair: DexScreenerPair): number | null {
  const explicitMarketCap = toFiniteNumber(pair.marketCap ?? pair.fdv);
  if (explicitMarketCap !== null && explicitMarketCap > 0) {
    return explicitMarketCap;
  }

  return marketCapFromPrice(pair.priceUsd);
}

async function fetchDexScreenerMarketCaps(bulls: Bull[]): Promise<Record<string, number> | null> {
  if (bulls.length === 0) {
    return null;
  }

  const mintToBullId = new Map(bulls.map((bull) => [bull.tokenMint, bull.id]));
  const url = `https://api.dexscreener.com/latest/dex/tokens/${bulls.map((bull) => bull.tokenMint).join(",")}`;
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Dexscreener market cap lookup failed with ${response.status}`);
  }

  const payload = (await response.json()) as DexScreenerPayload;
  const bestByBull = new Map<string, { marketCap: number; liquidityUsd: number }>();

  for (const pair of payload.pairs ?? []) {
    if (pair.chainId !== "solana" || !pair.baseToken?.address) {
      continue;
    }

    const bullId = mintToBullId.get(pair.baseToken.address);
    const marketCap = extractDexScreenerMarketCap(pair);
    if (!bullId || marketCap === null) {
      continue;
    }

    const liquidityUsd = toFiniteNumber(pair.liquidity?.usd) ?? 0;
    const currentBest = bestByBull.get(bullId);
    if (!currentBest || liquidityUsd >= currentBest.liquidityUsd) {
      bestByBull.set(bullId, { marketCap, liquidityUsd });
    }
  }

  const result = Object.fromEntries(
    [...bestByBull.entries()].map(([bullId, value]) => [bullId, round(value.marketCap, 2)]),
  );

  return Object.keys(result).length > 0 ? result : null;
}

function extractProviderMarketCap(value: ProviderMarketValue | undefined): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const explicitMarketCap = toFiniteNumber(value.marketCap ?? value.market_cap);
  if (explicitMarketCap !== null) {
    return explicitMarketCap;
  }

  return marketCapFromPrice(value.price ?? value.priceUsd ?? value.price_usd);
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
    const marketCap = extractProviderMarketCap(value);

    if (marketCap !== null) {
      result[bull.id] = marketCap;
    }
  }

  return result;
}

export async function getMarketCapSnapshot(
  bulls: Bull[],
  race?: Race,
  at = new Date(),
): Promise<RaceSnapshot> {
  const [heliusCaps, dexScreenerCaps, providerCaps] = await Promise.all([
    fetchHeliusMarketCaps(bulls).catch(() => null),
    fetchDexScreenerMarketCaps(bulls).catch(() => null),
    fetchProviderMarketCaps(bulls).catch(() => null),
  ]);
  const marketCaps = { ...(heliusCaps ?? {}), ...(dexScreenerCaps ?? {}), ...(providerCaps ?? {}) };
  const snapshot: RaceSnapshot = {};

  for (const bull of bulls) {
    snapshot[bull.id] = {
      marketCap: round(marketCaps[bull.id] ?? (config.testMode ? mockMarketCap(bull, at, race) : 0), 2),
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

export function getWinnerFromSnapshots(_start: RaceSnapshot, end: RaceSnapshot): string | null {
  let winner: string | null = null;
  let highestMarketCap = Number.NEGATIVE_INFINITY;

  for (const bullId of Object.keys(end)) {
    const marketCap = end[bullId].marketCap;
    if (marketCap > highestMarketCap) {
      highestMarketCap = marketCap;
      winner = bullId;
    }
  }

  return highestMarketCap > 0 ? winner : null;
}
