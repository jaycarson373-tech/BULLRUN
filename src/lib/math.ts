export function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function percentChange(start: number, current: number): number {
  if (!Number.isFinite(start) || start <= 0) {
    return 0;
  }

  return round(((current - start) / start) * 100, 2);
}

export function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
