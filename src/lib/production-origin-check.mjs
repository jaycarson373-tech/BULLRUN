const API_ROUTES = [
  {
    path: "/api/health",
    accepts: (value) =>
      isRecord(value) &&
      typeof value.ok === "boolean" &&
      typeof value.databaseConfigured === "boolean" &&
      typeof value.databaseReachable === "boolean",
    ready: (value) => value.ok === true && value.databaseReachable === true,
  },
  {
    path: "/api/current-race",
    accepts: (value) =>
      isRecord(value) &&
      typeof value.status === "string" &&
      Array.isArray(value.competitors) &&
      Object.hasOwn(value, "race"),
  },
  {
    path: "/api/standings",
    accepts: Array.isArray,
  },
];

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function inspectRoute(baseUrl, route, fetchImpl) {
  const url = new URL(route.path, baseUrl);
  let response;

  try {
    response = await fetchImpl(url, {
      cache: "no-store",
      headers: { accept: "application/json" },
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    return {
      path: route.path,
      ok: false,
      reason: error instanceof Error ? error.message : "request failed",
    };
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (response.url) {
    let responseOrigin;
    try {
      responseOrigin = new URL(response.url).origin;
    } catch {
      return { path: route.path, ok: false, status: response.status, reason: "response URL is invalid" };
    }
    if (responseOrigin !== new URL(baseUrl).origin) {
      return { path: route.path, ok: false, status: response.status, reason: "request redirected to a different origin" };
    }
  }
  if (!response.ok) {
    return { path: route.path, ok: false, status: response.status, reason: "HTTP request failed" };
  }
  if (!contentType.toLowerCase().includes("application/json")) {
    return { path: route.path, ok: false, status: response.status, reason: "expected JSON; received a different content type" };
  }

  let value;
  try {
    value = await response.json();
  } catch {
    return { path: route.path, ok: false, status: response.status, reason: "response is not valid JSON" };
  }

  if (!route.accepts(value)) {
    return { path: route.path, ok: false, status: response.status, reason: "response does not match the BULLRUN API shape" };
  }
  if (route.ready && !route.ready(value)) {
    return { path: route.path, ok: false, status: response.status, reason: "persistent database health check is not ready" };
  }

  return { path: route.path, ok: true, status: response.status };
}

export async function verifyProductionOrigin(baseUrl, fetchImpl = fetch) {
  const normalizedBaseUrl = new URL(baseUrl);
  normalizedBaseUrl.pathname = normalizedBaseUrl.pathname.replace(/\/$/, "");
  normalizedBaseUrl.search = "";
  normalizedBaseUrl.hash = "";

  const results = await Promise.all(
    API_ROUTES.map((route) => inspectRoute(normalizedBaseUrl, route, fetchImpl)),
  );

  return { ok: results.every((result) => result.ok), results };
}
