// HamzaPhone Analytics Timezone & Date Boundary Utility
// Algeria operates in UTC+1 (Africa/Algiers) with NO Daylight Saving Time.

import { AnalyticsPeriod } from '@/types/analytics.types';

export const ALGIERS_TIMEZONE = 'Africa/Algiers';
export const ALGIERS_UTC_OFFSET_HOURS = 1;

/**
 * Returns the current date in Algiers local time (UTC+1)
 */
export function getAlgiersNow(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 3600000 * ALGIERS_UTC_OFFSET_HOURS);
}

/**
 * Calculates start and end Date boundaries for reporting periods aligned to Algiers calendar days
 */
export function resolveAlgiersDateRange(
  period: AnalyticsPeriod = '30d',
  customStart?: string,
  customEnd?: string
): { startDate: Date; endDate: Date; startDateIso: string; endDateIso: string } {
  const now = new Date();

  // If custom range provided
  if (period === 'custom' && customStart && customEnd) {
    const start = new Date(customStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(customEnd);
    end.setHours(23, 59, 59, 999);
    return {
      startDate: start,
      endDate: end,
      startDateIso: start.toISOString(),
      endDateIso: end.toISOString(),
    };
  }

  const end = new Date(now);
  const start = new Date(now);

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case '7d':
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      break;
    case '90d':
      start.setDate(start.getDate() - 90);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      break;
  }

  return {
    startDate: start,
    endDate: end,
    startDateIso: start.toISOString(),
    endDateIso: end.toISOString(),
  };
}
