import assert from "node:assert/strict";
import test from "node:test";
import { persistentStorageUnavailableError, productionRequiresPersistentStorage } from "../src/server/repositories/storage-policy.mjs";

test("production always requires persistent storage, even in test mode", () => {
  assert.equal(productionRequiresPersistentStorage({ NODE_ENV: "production" }), true);
  assert.equal(productionRequiresPersistentStorage({ NODE_ENV: "production", TEST_MODE: "true" }), true);
});

test("local development and isolated tests may use seeded memory storage", () => {
  assert.equal(productionRequiresPersistentStorage({ NODE_ENV: "development", TEST_MODE: "true" }), false);
  assert.equal(productionRequiresPersistentStorage({ NODE_ENV: "test", TEST_MODE: "true" }), false);
});


test("missing production storage is classified as a retryable service-unavailable response", () => {
  const error = persistentStorageUnavailableError();
  assert.equal(error.status, 503);
  assert.match(error.message, /NEXT_PUBLIC_SUPABASE_URL/);
});
