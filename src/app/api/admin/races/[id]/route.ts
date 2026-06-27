import { assertAdmin } from "@/server/admin/auth";
import { updateRace } from "@/server/admin/admin-service";
import { jsonError, jsonOk } from "@/server/http";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertAdmin(request);
    const { id } = await context.params;
    return jsonOk(await updateRace(id, await request.json()));
  } catch (error) {
    return jsonError(error);
  }
}
