import { toDateKey } from '../db/helpers';

/** Monday (or Sunday if weekStartsOn=0) of the week containing `d`. */
export function startOfWeek(d = new Date(), weekStartsOn = 1) {
  const date = new Date(d);
  const day = date.getDay(); // 0=Sun … 6=Sat
  const diff = weekStartsOn === 0 ? -day : (day === 0 ? -6 : 1 - day);
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * The days to show for a week that starts on `weekStart`:
 * Mon–Fri (5) or the whole week (7). With a Sunday-start week, the five working
 * days begin the day after `weekStart`.
 */
export function weekDays(weekStart, { includeWeekend = false, weekStartsOn = 1 } = {}) {
  const count = includeWeekend ? 7 : 5;
  const skip = !includeWeekend && weekStartsOn === 0 ? 1 : 0;
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + skip + i);
    return d;
  });
}

export function addWeeks(weekStart, delta) {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + delta * 7);
  return d;
}

export function isSameDay(a, b) {
  return toDateKey(a) === toDateKey(b);
}

export function isSameWeek(a, b, weekStartsOn = 1) {
  return toDateKey(startOfWeek(a, weekStartsOn)) === toDateKey(startOfWeek(b, weekStartsOn));
}

/** JS getDay() → index into weekDays(): Mon=0 … Sun=6 */
export function dayIndex(d) {
  const g = d.getDay(); // 0=Sun
  return g === 0 ? 6 : g - 1;
}

/** "6 – 10 Oct 2025" or "29 Sep – 3 Oct 2025" */
export function formatWeekRange(weekStart, { includeWeekend = false, weekStartsOn = 1 } = {}) {
  const days = weekDays(weekStart, { includeWeekend, weekStartsOn });
  const first = days[0];
  const last = days[days.length - 1];
  const sameMonth = first.getMonth() === last.getMonth();
  const sameYear = first.getFullYear() === last.getFullYear();
  const monthFmt = { month: 'short' };
  const opts = (extra) => ({ day: 'numeric', ...monthFmt, ...extra });

  if (sameMonth) {
    return `${first.getDate()} – ${last.toLocaleDateString(undefined, opts({ year: 'numeric' }))}`;
  }
  if (sameYear) {
    return `${first.toLocaleDateString(undefined, opts())} – ${last.toLocaleDateString(undefined, opts({ year: 'numeric' }))}`;
  }
  return `${first.toLocaleDateString(undefined, opts({ year: 'numeric' }))} – ${last.toLocaleDateString(undefined, opts({ year: 'numeric' }))}`;
}

/** Minutes since midnight from "HH:MM" */
export function hhmmToMin(hhmm) {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
