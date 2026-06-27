import { assertAdmin } from "@/server/admin/auth";
import { performAdminAction } from "@/server/admin/admin-service";
import { jsonError, jsonOk } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertAdmin(request);
    return jsonOk(await performAdminAction(await request.json()));
  } catch (error) {
    return jsonError(error);
  }
}
