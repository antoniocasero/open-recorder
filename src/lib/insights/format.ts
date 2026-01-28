import type { InsightsRangePreset } from './types';

export function formatMinutes(seconds: number): string {
  const minutes = seconds / 60;
  return minutes.toFixed(1);
}

export function formatPct(pct: number): string {
  return `${pct.toFixed(0)}%`;
}

export function formatDayLabel(dayStartUnix: number, preset: InsightsRangePreset): string {
  const date = new Date(dayStartUnix * 1000);

  if (preset === 'all') {
    return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
