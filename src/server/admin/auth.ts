import { getAdminKey } from "@/lib/config";

export function assertAdmin(request: Request): void {
  const expected = getAdminKey();
  if (!expected) {
    throw Object.assign(new Error("Admin API key is not configured"), { status: 503 });
  }

  const authorization = request.headers.get("authorization");
  const bearer = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : undefined;
  const provided = request.headers.get("x-admin-key") ?? bearer;

  if (provided !== expected) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
}
