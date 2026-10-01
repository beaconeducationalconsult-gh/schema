import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { useNow } from '../hooks/useNow';
import { getSettings } from '../db/settings';
import { subjects as subjectRepo } from '../db/helpers';
import { toast } from '../lib/dialogs';
import { playChime } from '../lib/chime';
import {
  dueReminders,
  reminderKey,
  reminderMessage,
  loadReminded,
  saveReminded,
  showSystemNotification,
} from '../lib/reminders';

/**
 * Renders nothing. While the app is open (tab, installed PWA window or in the
 * background) it reminds you `prefs.reminderMinutes` before each of today's classes:
 * an in-app toast, a chime/vibration when the screen is visible, and a system
 * notification if you enabled them in Settings. 0 minutes = off.
 * (A web app cannot wake itself when fully closed without a push server.)
 */
export default function ClassReminders() {
  const navigate = useNavigate();
  const { now, dateKey, slots } = useNow(10_000);
  const reminderMinutes = useLiveQuery(
    async () => (await getSettings()).prefs.reminderMinutes,
    [],
    0
  );
  const subjects = useLiveQuery(async () =>
    Object.fromEntries((await subjectRepo.all()).map((s) => [s.id, s]))
  );

  // A tap on a system notification: the service worker focuses this window and
  // asks us to route (same-origin paths only).
  useEffect(() => {
    const sw = navigator.serviceWorker;
    if (!sw?.addEventListener) return undefined;
    const onMessage = (e) => {
      const url = e.data?.type === 'tc-navigate' ? e.data.url : null;
      if (typeof url === 'string' && url.startsWith('/') && !url.startsWith('//')) navigate(url);
    };
    sw.addEventListener('message', onMessage);
    return () => sw.removeEventListener('message', onMessage);
  }, [navigate]);

  useEffect(() => {
    if (!subjects) return; // wait for names so the message never says just "Class"
    const reminded = loadReminded(dateKey);
    const due = dueReminders(slots, now, dateKey, reminderMinutes, reminded);
    if (due.length === 0) return;

    for (const slot of due) reminded.add(reminderKey(dateKey, slot));
    saveReminded(dateKey, reminded);

    const watching = document.visibilityState === 'visible' && document.hasFocus();
    for (const slot of due) {
      const { title, body } = reminderMessage(slot, subjects[slot.subjectId], now);
      toast(`${title} · ${body}`, {
        duration: 20_000,
        action: { label: 'Open', onClick: () => navigate('/') },
      });
      if (watching) playChime();
      else showSystemNotification(title, body, reminderKey(dateKey, slot));
    }
  }, [now, dateKey, slots, reminderMinutes, subjects, navigate]);

  return null;
}
