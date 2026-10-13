import assert from "node:assert/strict";
import test from "node:test";
import { apiAutoTickEnabled } from "../src/lib/api-auto-tick.mjs";

test("production web requests never become a second race or payout scheduler", () => {
  assert.equal(apiAutoTickEnabled({ NODE_ENV: "production" }), false);
  assert.equal(apiAutoTickEnabled({ NODE_ENV: "production", API_ENABLE_AUTO_TICK: "true" }), false);
});

test("local development can opt into automatic ticks and disable them explicitly", () => {
  assert.equal(apiAutoTickEnabled({ NODE_ENV: "development" }), true);
  assert.equal(apiAutoTickEnabled({ NODE_ENV: "development", API_ENABLE_AUTO_TICK: "false" }), false);
  assert.equal(apiAutoTickEnabled({ NODE_ENV: "test" }), true);
});
