import { jsonError, jsonOk } from "@/server/http";
import { getUpcomingRaces } from "@/server/race/dashboard-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? 10);
    return jsonOk(await getUpcomingRaces(Math.min(Math.max(limit, 1), 10)));
  } catch (error) {
    return jsonError(error);
  }
}
