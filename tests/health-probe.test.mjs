import assert from "node:assert/strict";
import test from "node:test";
import { probeDependency } from "../src/lib/health-probe.mjs";

test("reports a dependency as healthy after a successful probe", async () => {
  assert.equal(await probeDependency(async () => ({ error: null })), true);
});

test("reports query failures as unhealthy", async () => {
  assert.equal(await probeDependency(async () => ({ error: new Error("database error") })), false);
});

test("reports thrown connection failures as unhealthy without propagating them", async () => {
  assert.equal(await probeDependency(async () => { throw new Error("connection refused"); }), false);
});
