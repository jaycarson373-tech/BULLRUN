import { LiveRacePage } from "@/components/dashboard/live-dashboard";
import { getDashboardData } from "@/server/race/dashboard-service";

export const dynamic = "force-dynamic";

export default async function LivePage() {
  const data = await getDashboardData();

  return <LiveRacePage initialData={data} />;
}
