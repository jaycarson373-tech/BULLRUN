import { jsonError, jsonOk } from "@/server/http";
import { getRaceHistory } from "@/server/race/dashboard-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? 10);
    return jsonOk(await getRaceHistory(Math.min(Math.max(limit, 1), 25)));
  } catch (error) {
    return jsonError(error);
  }
}
