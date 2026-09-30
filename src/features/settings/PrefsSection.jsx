import React from 'react';

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

      <Row label="Reminder before class">
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
    </section>
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
