type WinnerOverrideRecord = {
  status: "scheduled" | "live" | "completed" | "paused";
  bullIds: string[];
  snapshotStart: Record<string, { marketCap?: number; recordedAt?: string }> | null;
  snapshotEnd: Record<string, { marketCap?: number; recordedAt?: string }> | null;
};

export type WinnerOverrideBlockReason =
  | "race-not-completed"
  | "race-snapshot-incomplete"
  | "distribution-already-exists";

function hasCompleteSnapshot(
  snapshot: WinnerOverrideRecord["snapshotStart"],
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

export function getWinnerOverrideBlockReason(
  race: WinnerOverrideRecord,
  distributionExists: boolean,
): WinnerOverrideBlockReason | null {
  if (race.status !== "completed") return "race-not-completed";
  if (
    !hasCompleteSnapshot(race.snapshotStart, race.bullIds) ||
    !hasCompleteSnapshot(race.snapshotEnd, race.bullIds)
  ) {
    return "race-snapshot-incomplete";
  }
  if (distributionExists) return "distribution-already-exists";
  return null;
}
