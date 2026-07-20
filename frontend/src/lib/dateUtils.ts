/** Calendar date in the user's local timezone (YYYY-MM-DD) */
export function localDateStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Local time as HH:mm (24-hour) */
export function localTimeStr(date: Date = new Date()): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function isTodayDateStr(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  return dateStr.slice(0, 10) === localDateStr();
}

/** Walk-in today uses current time; future check-ins keep standard 14:00 */
export function defaultCheckInTimeForDate(dateStr?: string | null): string {
  return isTodayDateStr(dateStr) ? localTimeStr() : '14:00';
}

export function localTomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return localDateStr(d);
}

/** YYYY-MM-DD from API date/datetime strings */
export function dateOnly(value?: string | null): string | null {
  if (!value) return null;
  return String(value).slice(0, 10);
}
