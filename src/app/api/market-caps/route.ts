import { jsonError, jsonOk } from "@/server/http";
import { getMarketCapSnapshot } from "@/server/market/market-cap-service";
import { getRepository } from "@/server/repositories/repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const repo = getRepository();
    const { searchParams } = new URL(request.url);
    const raceId = searchParams.get("raceId");
    const bulls = await repo.getBulls();
    const race = raceId ? await repo.getRace(raceId) : null;
    const targetBulls = race ? bulls.filter((bull) => race.bullIds.includes(bull.id)) : bulls;

    return jsonOk(await getMarketCapSnapshot(targetBulls, race ?? undefined));
  } catch (error) {
    return jsonError(error);
  }
}
