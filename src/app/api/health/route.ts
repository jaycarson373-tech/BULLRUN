import { NextResponse } from "next/server";
import { config, isSupabaseConfigured } from "@/lib/config";
import { probeDependency } from "@/lib/health-probe.mjs";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const databaseConfigured = isSupabaseConfigured();
  const databaseReachable = databaseConfigured
    ? await probeDependency(async () => {
        const { error } = await getSupabaseAdmin().from("seasons").select("id").limit(1);
        return { error };
      })
    : false;
  const marketDataMode = config.marketCapApiUrl
    ? "custom-provider-with-dexscreener-fallback"
    : config.heliusApiKey || config.heliusRpcUrl
      ? "helius-and-dexscreener"
      : "public-dexscreener";
  const healthy = databaseReachable;

  return NextResponse.json(
    {
      ok: healthy,
      databaseConfigured,
      databaseReachable,
      marketDataMode,
      payoutExecutionEnabled: config.payoutExecutionEnabled,
      checkedAt: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  );
}
