import { jsonError, jsonOk } from "@/server/http";
import { getRepository } from "@/server/repositories/repository";
import { calculateStandings } from "@/server/standings/standings-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return jsonOk(calculateStandings(await getRepository().getBulls()));
  } catch (error) {
    return jsonError(error);
  }
}
