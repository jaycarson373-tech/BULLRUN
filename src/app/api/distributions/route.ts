import { jsonError, jsonOk } from "@/server/http";
import { getRepository } from "@/server/repositories/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return jsonOk(await getRepository().getDistributions());
  } catch (error) {
    return jsonError(error);
  }
}
