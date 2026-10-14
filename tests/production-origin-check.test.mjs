import assert from "node:assert/strict";
import test from "node:test";
import { verifyProductionOrigin } from "../src/lib/production-origin-check.mjs";

function response(body, { status = 200, contentType = "application/json" } = {}) {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers: { "content-type": contentType },
  });
}

function responseFromDifferentOrigin(body, url) {
  const result = response(body);
  Object.defineProperty(result, "url", { value: url });
  return result;
}

test("rejects a static HTML site even when it returns HTTP 200 for API paths", async () => {
  const result = await verifyProductionOrigin("https://bullrun.example", async () =>
    response("<!doctype html><html>other app</html>", { contentType: "text/html; charset=utf-8" }),
  );

  assert.equal(result.ok, false);
  assert.deepEqual(result.results.map(({ ok }) => ok), [false, false, false]);
  assert.match(result.results[0].reason, /expected JSON/);
});

test("rejects API responses redirected to a different origin", async () => {
  const result = await verifyProductionOrigin("https://bullrun.example", async () =>
    responseFromDifferentOrigin(
      { ok: true, databaseConfigured: true, databaseReachable: true },
      "https://other-app.example/api/health",
    ),
  );

  assert.equal(result.ok, false);
  assert.ok(result.results.every(({ reason }) => reason === "request redirected to a different origin"));
});

test("requires a healthy persistent database and the expected BULLRUN route shapes", async () => {
  const fixtures = new Map([
    ["/api/health", { ok: true, databaseConfigured: true, databaseReachable: true }],
    ["/api/current-race", { race: null, status: "offseason", competitors: [] }],
    ["/api/standings", []],
  ]);
  const result = await verifyProductionOrigin("https://bullrun.example", async (url) =>
    response(fixtures.get(new URL(url).pathname)),
  );

  assert.equal(result.ok, true);
  assert.equal(result.results.length, 3);
});

test("fails health when storage is not reachable even if the route responds", async () => {
  const result = await verifyProductionOrigin("https://bullrun.example", async (url) => {
    const path = new URL(url).pathname;
    if (path === "/api/health") {
      return response({ ok: false, databaseConfigured: true, databaseReachable: false }, { status: 503 });
    }
    if (path === "/api/current-race") {
      return response({ race: null, status: "offseason", competitors: [] });
    }
    return response([]);
  });

  assert.equal(result.ok, false);
  assert.equal(result.results[0].status, 503);
});
