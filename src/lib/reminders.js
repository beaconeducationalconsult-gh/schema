import { toMin } from '../db/helpers';

const STORE_KEY = 'tc-reminded';

const secondsOfDay = (d) => d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();

export const reminderKey = (dateKey, slot) => `${dateKey}:${slot.id}`;

/**
 * Slots (of today) whose start is within `reminderMinutes` from now, hasn't
 * started yet, and hasn't been reminded already. `reminderMinutes <= 0` switches reminders off.
 */
export function dueReminders(slots, now, dateKey, reminderMinutes, reminded = new Set()) {
  const lead = Number(reminderMinutes) || 0;
  if (lead <= 0) return [];
  const nowSec = secondsOfDay(now);
  return slots.filter((s) => {
    const untilStart = toMin(s.startTime) * 60 - nowSec;
    return untilStart > 0 && untilStart <= lead * 60 && !reminded.has(reminderKey(dateKey, s));
  });
}

/** "Mathematics · Basic 6 starts in 5 min" / "… starts at 08:30" */
export function reminderMessage(slot, subject, now) {
  const mins = Math.max(1, Math.ceil((toMin(slot.startTime) * 60 - secondsOfDay(now)) / 60));
  const name = subject?.name || 'Class';
  const where = [slot.classLevel, slot.room].filter(Boolean).join(' · ');
  return {
    title: `${name} starts in ${mins} min`,
    body: `${slot.startTime} – ${slot.endTime}${where ? ` · ${where}` : ''}`,
  };
}

/* Already-reminded keys survive reloads and are shared between tabs (one day at a time). */
export function loadReminded(dateKey, storage = globalThis.localStorage) {
  try {
    const saved = JSON.parse(storage.getItem(STORE_KEY) || 'null');
    return new Set(saved?.date === dateKey ? saved.keys : []);
  } catch {
    return new Set();
  }
}
export function saveReminded(dateKey, keys, storage = globalThis.localStorage) {
  try {
    storage.setItem(STORE_KEY, JSON.stringify({ date: dateKey, keys: [...keys] }));
  } catch {
    /* private mode — worst case the reminder repeats after a reload */
  }
}

/* ---- system notifications (optional; the in-app toast always works) ---- */

/** 'unsupported' | 'default' | 'granted' | 'denied' */
export function notificationStatus() {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
}

/** Must be called from a click handler. Resolves to the new status. */
export async function requestNotificationPermission() {
  if (notificationStatus() === 'unsupported') return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return notificationStatus();
  }
}

/** Fire a system notification if permission was granted. Returns whether one was shown. */
export async function showSystemNotification(title, body, tag) {
  if (notificationStatus() !== 'granted') return false;
  const options = { body, tag, icon: '/icons/icon-192.png' };
  try {
    // Android Chrome only allows notifications through the service worker.
    const reg = await navigator.serviceWorker?.getRegistration?.();
    if (reg?.showNotification) {
      await reg.showNotification(title, options);
      return true;
    }
    new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}
