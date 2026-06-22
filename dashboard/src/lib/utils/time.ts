import type { ClockFormat } from '$lib/types';

/** Time-of-day greeting that shifts through the day, Apple-style. */
export function greetingFor(date: Date): string {
  const h = date.getHours();
  if (h < 5) return 'Good Evening';
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/** "Monday, June 22" */
export function formatLongDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

/** Clock string honouring the 12h/24h preference. */
export function formatClock(date: Date, format: ClockFormat, withSeconds = false): string {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: withSeconds ? '2-digit' : undefined,
    hour12: format === '12h'
  });
}

/** Time in a named IANA timezone, for the world clock. */
export function formatInZone(date: Date, timeZone: string, format: ClockFormat): string {
  try {
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: format === '12h',
      timeZone
    });
  } catch {
    return '--:--';
  }
}

/** Whole days (rounded up) between now and a target date. */
export function daysUntil(target: Date, now = new Date()): number {
  const ms = target.getTime() - now.getTime();
  return Math.ceil(ms / 86_400_000);
}

/** "3:00" mm:ss from a number of seconds, for timers. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}
