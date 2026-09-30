import { toMin } from '../db/helpers';

const secondsOfDay = (d) => d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();

/**
 * How far through a class are we?
 * Returns { totalSec, remainingSec, remaining } where `remaining` is 0..1
 * (1 = just started, 0 = over). Null if the slot has no positive length.
 */
export function classCountdown(now, startTime, endTime) {
  const start = toMin(startTime) * 60;
  const end = toMin(endTime) * 60;
  const totalSec = end - start;
  if (!(totalSec > 0)) return null;
  const remainingSec = Math.min(totalSec, Math.max(0, end - secondsOfDay(now)));
  return { totalSec, remainingSec, remaining: remainingSec / totalSec };
}

/**
 * Countdown to the start of the next class, over a lead-in window (default 15 min).
 * `remaining` is 1 when the window opens and 0 at the start. Null outside the window.
 */
export function startCountdown(now, startTime, windowMin = 15) {
  const windowSec = windowMin * 60;
  const remainingSec = toMin(startTime) * 60 - secondsOfDay(now);
  if (remainingSec < 0 || remainingSec > windowSec) return null;
  return { totalSec: windowSec, remainingSec, remaining: remainingSec / windowSec };
}
