import React, { useEffect, useState } from 'react';
import { databaseSummary } from '../../db/backup';

export default function StorageSection() {
  const [summary, setSummary] = useState(null);

  const load = async () => setSummary(await databaseSummary());
  useEffect(() => { load(); }, []);

  if (!summary) return null;

  const { counts, usageBytes, quotaBytes, persisted } = summary;
  const pct = usageBytes && quotaBytes ? (usageBytes / quotaBytes) * 100 : 0;

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
        📦 Local storage
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
        <Stat label="Subjects" value={counts.subjects} />
        <Stat label="Standards" value={counts.standards} />
        <Stat label="Lessons" value={counts.lessons} />
        <Stat label="Activities" value={counts.activities} />
        <Stat label="Notes" value={counts.notes} />
        <Stat label="Timetable slots" value={counts.timetable} />
      </div>

      {usageBytes != null && (
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>{(usageBytes / 1024).toFixed(0)} KB used</span>
            <span>{quotaBytes ? `of ${(quotaBytes / 1024 / 1024).toFixed(0)} MB` : ''}</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-900"
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 text-xs">
        <span
          className={`w-2 h-2 rounded-full ${
            persisted ? 'bg-emerald-500' : 'bg-amber-500'
          }`}
        />
        <span className="text-slate-600">
          {persisted
            ? 'Persistent storage granted'
            : 'Best-effort storage (browser may evict if disk is low)'}
        </span>
      </div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-lg px-3 py-2">
      <div className="text-lg font-bold text-slate-800">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
    </div>
  );
}
