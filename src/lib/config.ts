export function readEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

export const config = {
  siteUrl: readEnv("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000",
  supabaseUrl: readEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: readEnv("SUPABASE_SERVICE_ROLE_KEY"),
  adminApiKey: readEnv("ADMIN_API_KEY"),
  seasonStartIso: readEnv("SEASON_START_ISO"),
  workerMode: readEnv("WORKER_MODE") ?? "cron",
  workerPollMs: Number(readEnv("WORKER_POLL_MS") ?? 30000),
  apiEnableAutoTick: (readEnv("API_ENABLE_AUTO_TICK") ?? "true") !== "false",
  defaultCreatorFeeSol: Number(readEnv("DEFAULT_CREATOR_FEE_SOL") ?? 2),
  testMode: (readEnv("TEST_MODE") ?? "false") === "true",
  bullrunMint: readEnv("BULLRUN_MINT") ?? readEnv("NEXT_PUBLIC_BULLRUN_CA"),
  bullrunMinHolding: Number(readEnv("BULLRUN_MIN_HOLDING") ?? 100_000),
  raceDurationMinutes: Number(readEnv("RACE_DURATION_MINUTES") ?? 90),
  marketCapApiUrl: readEnv("MARKET_CAP_API_URL"),
  marketCapApiKey: readEnv("MARKET_CAP_API_KEY"),
  heliusApiKey: readEnv("HELIUS_API_KEY"),
  heliusRpcUrl: readEnv("HELIUS_RPC_URL"),
  tokenFixedSupply: Number(readEnv("TOKEN_FIXED_SUPPLY") ?? 1_000_000_000),
};

export function isSupabaseConfigured(): boolean {
  return Boolean(config.supabaseUrl && config.supabaseServiceRoleKey);
}

export function getAdminKey(): string | undefined {
  if (config.adminApiKey) {
    return config.adminApiKey;
  }

  return process.env.NODE_ENV === "development" ? "dev-admin" : undefined;
}
