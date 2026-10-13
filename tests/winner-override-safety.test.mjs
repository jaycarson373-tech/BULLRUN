import assert from "node:assert/strict";
import test from "node:test";

import { getWinnerOverrideBlockReason } from "../src/server/admin/winner-override-safety.ts";

const ids = ["a", "b", "c", "d"];
const snapshot = Object.fromEntries(ids.map((id) => [id, {
  marketCap: 100,
  recordedAt: "2026-10-13T12:00:00.000Z",
}]));
const completedRace = {
  status: "completed",
  bullIds: ids,
  snapshotStart: snapshot,
  snapshotEnd: snapshot,
};

test("winner correction is permitted only on a completed race with both complete snapshots and no distribution", () => {
  assert.equal(getWinnerOverrideBlockReason(completedRace, false), null);
  assert.equal(getWinnerOverrideBlockReason({ ...completedRace, status: "live" }, false), "race-not-completed");
  assert.equal(getWinnerOverrideBlockReason({ ...completedRace, snapshotEnd: null }, false), "race-snapshot-incomplete");
  assert.equal(getWinnerOverrideBlockReason(completedRace, true), "distribution-already-exists");
});
