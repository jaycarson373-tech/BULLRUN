import assert from "node:assert/strict";
import test from "node:test";
import { mockMarketDataEnabled } from "../src/lib/mock-data-policy.mjs";

test("production never turns on generated market caps, even when TEST_MODE is set", () => {
  assert.equal(mockMarketDataEnabled({ NODE_ENV: "production", TEST_MODE: "true" }), false);
  assert.equal(mockMarketDataEnabled({ NODE_ENV: "production", TEST_MODE: "false" }), false);
});

test("local environments can explicitly use mock market data", () => {
  assert.equal(mockMarketDataEnabled({ NODE_ENV: "development", TEST_MODE: "true" }), true);
  assert.equal(mockMarketDataEnabled({ NODE_ENV: "test", TEST_MODE: "true" }), true);
  assert.equal(mockMarketDataEnabled({ NODE_ENV: "development" }), false);
});
