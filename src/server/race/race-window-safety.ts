type SnapshotValue = {
  marketCap?: number;
  recordedAt?: string;
};

export type RaceWindowRecord = {
  status: "scheduled" | "live" | "completed" | "paused";
  startTime: string;
  endTime: string;
  bullIds: string[];
  snapshotStart: Record<string, SnapshotValue> | null;
};

export type RaceWindowBlockReason =
  | "invalid-race-window"
  | "race-ended-before-started"
  | "start-snapshot-window-missed"
  | "start-snapshot-missing"
  | "end-snapshot-window-missed";

export const RACE_CAPTURE_GRACE_MS = 60_000;

export function hasCompleteMarketCapSnapshot(
  snapshot: Record<string, SnapshotValue> | null | undefined,
  bullIds: string[],
): boolean {
  return bullIds.length > 0 && bullIds.every((id) => {
    const value = snapshot?.[id];
    return Boolean(
      value &&
      Number.isFinite(value.marketCap) &&
      (value.marketCap ?? 0) > 0 &&
      Number.isFinite(Date.parse(value.recordedAt ?? "")),
    );
  });
}

/** Fail closed when a worker can no longer capture a race close to its actual window. */
export function getRaceWindowBlockReason(
  race: RaceWindowRecord,
  now: Date,
  graceMs = RACE_CAPTURE_GRACE_MS,
): RaceWindowBlockReason | null {
  if (race.status === "completed" || race.status === "paused") return null;

  const start = Date.parse(race.startTime);
  const end = Date.parse(race.endTime);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end || !Number.isFinite(now.getTime())) {
    return "invalid-race-window";
  }

  const current = now.getTime();
  if (race.status === "scheduled") {
    if (current >= end) return "race-ended-before-started";
    if (current - start > graceMs) return "start-snapshot-window-missed";
    return null;
  }

  if (!hasCompleteMarketCapSnapshot(race.snapshotStart, race.bullIds)) return "start-snapshot-missing";
  if (current - end > graceMs) return "end-snapshot-window-missed";
  return null;
}
