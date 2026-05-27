/** Matches vercel.json cron for /api/sync-trades */
export const DISCLOSURE_SYNC_HOUR_UTC = 6;
export const DISCLOSURE_SYNC_MINUTE = 0;

export interface DisclosureScheduleInfo {
  nextSyncAt: Date;
  dayLabel: string;
  timeEt: string;
  countdown: string;
  headline: string;
  detail: string;
}

function formatEtDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(date);
}

function getDayLabel(target: Date, now: Date): string {
  const targetKey = formatEtDateKey(target);
  if (targetKey === formatEtDateKey(now)) {
    return "Today";
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (targetKey === formatEtDateKey(tomorrow)) {
    return "Tomorrow";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "America/New_York",
  }).format(target);
}

function formatTimeEt(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  }).format(date);
}

function formatCountdown(target: Date, now: Date): string {
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) {
    return "syncing soon";
  }

  const totalMinutes = Math.floor(ms / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours >= 48) {
    const days = Math.floor(hours / 24);
    return `in ${days} day${days !== 1 ? "s" : ""}`;
  }

  if (hours > 0) {
    return `in ${hours}h ${minutes}m`;
  }

  return `in ${minutes}m`;
}

export function getNextDisclosureSync(now = new Date()): Date {
  const next = new Date(now);
  next.setUTCSeconds(0, 0);
  next.setUTCHours(DISCLOSURE_SYNC_HOUR_UTC, DISCLOSURE_SYNC_MINUTE, 0, 0);

  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1);
  }

  return next;
}

export function getDisclosureScheduleInfo(
  now = new Date()
): DisclosureScheduleInfo {
  const nextSyncAt = getNextDisclosureSync(now);
  const dayLabel = getDayLabel(nextSyncAt, now);
  const timeEt = formatTimeEt(nextSyncAt);
  const countdown = formatCountdown(nextSyncAt, now);

  return {
    nextSyncAt,
    dayLabel,
    timeEt,
    countdown,
    headline: `Next disclosure sync · ${dayLabel} ${timeEt}`,
    detail: `New STOCK Act filings land here after our daily pull (${countdown}). House & Senate batches usually publish overnight on weekdays.`,
  };
}
