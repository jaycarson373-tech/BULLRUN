import { LiveRacePage } from "@/components/dashboard/live-dashboard";
import { getDashboardData } from "@/server/race/dashboard-service";
import { isSupabaseConfigured } from "@/lib/config";
import { ProductionDataPending } from "@/components/dashboard/production-data-pending";

export const dynamic = "force-dynamic";

export default async function LivePage() {
  if (!isSupabaseConfigured()) {
    return <ProductionDataPending />;
  }

  const data = await getDashboardData();
  return <LiveRacePage initialData={data} />;
}
