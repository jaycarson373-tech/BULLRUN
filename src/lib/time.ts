export const RACE_DURATION_MS = 90 * 60 * 1000;

export function nowIso(): string {
  return new Date().toISOString();
}

export function msUntil(dateIso: string, now = new Date()): number {
  return new Date(dateIso).getTime() - now.getTime();
}

export function formatClockDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatDateTime(dateIso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateIso));
}
