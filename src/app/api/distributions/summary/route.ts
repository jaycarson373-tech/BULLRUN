import { getDistributionSummary } from "@/server/distributions/distribution-service";
import { jsonError, jsonOk } from "@/server/http";
import { getRepository } from "@/server/repositories/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return jsonOk(await getDistributionSummary(getRepository()));
  } catch (error) {
    return jsonError(error);
  }
}
