import React, { useState } from 'react';
import { notificationStatus, requestNotificationPermission } from '../../lib/reminders';

export default function PrefsSection({ prefs, onChange }) {
  const set = (patch) => onChange({ ...prefs, ...patch });

  return (
    <section className="bg-surface rounded-2xl border border-slate-200 p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
        ⚙️ Preferences
      </h2>

      <Row label="Week starts on">
        <select
          value={prefs.weekStartsOn}
          onChange={(e) => set({ weekStartsOn: Number(e.target.value) })}
          className="text-sm border border-slate-300 rounded-lg px-2.5 py-1.5 bg-surface"
        >
          <option value={1}>Monday</option>
          <option value={0}>Sunday</option>
        </select>
      </Row>

      <Row label="Show weekends">
        <input
          type="checkbox"
          checked={prefs.includeWeekend}
          onChange={(e) => set({ includeWeekend: e.target.checked })}
          className="w-4 h-4"
        />
      </Row>

      <Row label="Default activity length">
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={1}
            max={120}
            value={prefs.defaultActivityMinutes}
            onChange={(e) => set({ defaultActivityMinutes: Number(e.target.value) || 10 })}
            className="w-16 text-sm border border-slate-300 rounded-lg px-2 py-1.5"
          />
          <span className="text-xs text-slate-500">min</span>
        </div>
      </Row>

      <Row
        label="Reminder before class"
        hint="Toast + chime while the app is open. 0 turns reminders off."
      >
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            max={60}
            value={prefs.reminderMinutes}
            onChange={(e) => set({ reminderMinutes: Number(e.target.value) || 0 })}
            className="w-16 text-sm border border-slate-300 rounded-lg px-2 py-1.5"
          />
          <span className="text-xs text-slate-500">min</span>
        </div>
      </Row>

      <NotificationRow />
    </section>
  );
}

/** Optional system notifications for the class reminder (per device, asked on click). */
function NotificationRow() {
  const [status, setStatus] = useState(notificationStatus);
  if (status === 'unsupported') return null;

  const hints = {
    default: 'Also get a system notification when the app is in the background.',
    granted: 'On — reminders also appear as system notifications.',
    denied: 'Blocked. Allow notifications for this site in your browser settings.',
  };
  return (
    <Row label="Notifications" hint={hints[status]}>
      {status === 'granted' ? (
        <span className="text-xs font-semibold text-emerald-700">On</span>
      ) : (
        <button
          type="button"
          disabled={status === 'denied'}
          onClick={async () => setStatus(await requestNotificationPermission())}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
        >
          Enable
        </button>
      )}
    </Row>
  );
}

function Row({ label, hint, children }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
      <div>
        <div className="text-sm text-slate-700">{label}</div>
        {hint && <div className="text-[10px] text-slate-400">{hint}</div>}
      </div>
      {children}
    </div>
  );
}
