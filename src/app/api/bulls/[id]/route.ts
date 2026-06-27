import { jsonError, jsonOk } from "@/server/http";
import { getRepository } from "@/server/repositories/repository";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const bull = await getRepository().getBull(id);

    if (!bull) {
      return jsonOk({ error: "Bull not found" }, { status: 404 });
    }

    return jsonOk(bull);
  } catch (error) {
    return jsonError(error);
  }
}
