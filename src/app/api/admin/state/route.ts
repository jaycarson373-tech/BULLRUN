import { assertAdmin } from "@/server/admin/auth";
import { getAdminState } from "@/server/admin/admin-service";
import { jsonError, jsonOk } from "@/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    assertAdmin(request);
    return jsonOk(await getAdminState());
  } catch (error) {
    return jsonError(error);
  }
}
