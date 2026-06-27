import { jsonError, jsonOk } from "@/server/http";
import { getCurrentRaceView } from "@/server/race/dashboard-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return jsonOk(await getCurrentRaceView());
  } catch (error) {
    return jsonError(error);
  }
}
