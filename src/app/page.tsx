import { LiveDashboard } from "@/components/dashboard/live-dashboard";
import { getDashboardData } from "@/server/race/dashboard-service";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getDashboardData();

  return <LiveDashboard initialData={data} />;
}
