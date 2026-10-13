import assert from "node:assert/strict";
import test from "node:test";
import { getRaceWindowBlockReason, RACE_CAPTURE_GRACE_MS } from "../src/server/race/race-window-safety.ts";

const start = Date.parse("2026-10-13T12:00:00.000Z");
const end = Date.parse("2026-10-13T13:30:00.000Z");
const base = {
  status: "scheduled",
  startTime: new Date(start).toISOString(),
  endTime: new Date(end).toISOString(),
  bullIds: ["bull-a", "bull-b", "bull-c", "bull-d"],
  snapshotStart: null,
};
const startSnapshot = Object.fromEntries(base.bullIds.map((id) => [id, {
  marketCap: 100_000,
  recordedAt: new Date(start).toISOString(),
}]));

test("scheduled race can start on time and within the capture grace", () => {
  assert.equal(getRaceWindowBlockReason(base, new Date(start)), null);
  assert.equal(getRaceWindowBlockReason(base, new Date(start + RACE_CAPTURE_GRACE_MS)), null);
});

test("scheduled race pauses if its start snapshot window was missed", () => {
  assert.equal(getRaceWindowBlockReason(base, new Date(start + RACE_CAPTURE_GRACE_MS + 1)), "start-snapshot-window-missed");
  assert.equal(getRaceWindowBlockReason(base, new Date(end)), "race-ended-before-started");
});

test("live race requires a complete start snapshot", () => {
  assert.equal(getRaceWindowBlockReason({ ...base, status: "live" }, new Date(start + 10_000)), "start-snapshot-missing");
  const partial = { ...startSnapshot };
  delete partial["bull-d"];
  assert.equal(getRaceWindowBlockReason({ ...base, status: "live", snapshotStart: partial }, new Date(start + 10_000)), "start-snapshot-missing");
});

test("live race must be finalized within the end-capture grace", () => {
  const race = { ...base, status: "live", snapshotStart: startSnapshot };
  assert.equal(getRaceWindowBlockReason(race, new Date(end + RACE_CAPTURE_GRACE_MS)), null);
  assert.equal(getRaceWindowBlockReason(race, new Date(end + RACE_CAPTURE_GRACE_MS + 1)), "end-snapshot-window-missed");
});

test("invalid schedules block and terminal races are ignored", () => {
  assert.equal(getRaceWindowBlockReason({ ...base, endTime: "not-a-date" }, new Date(start)), "invalid-race-window");
  assert.equal(getRaceWindowBlockReason({ ...base, status: "completed" }, new Date(end + 10_000)), null);
});
