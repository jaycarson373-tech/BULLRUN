import { jsonError, jsonOk } from "@/server/http";
import { getRepository } from "@/server/repositories/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return jsonOk(await getRepository().getBulls());
  } catch (error) {
    return jsonError(error);
  }
}
