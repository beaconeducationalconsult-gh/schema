import React from 'react';
import { Link } from 'react-router-dom';

export function EmptyActivities({ onAdd, onLoadRoutine }) {
  return (
    <div className="bg-surface rounded-2xl border border-dashed border-slate-300 p-8 text-center">
      <div className="text-4xl mb-2">🎯</div>
      <p className="text-sm text-slate-600 mb-4">No teaching moves yet for this lesson.</p>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={onLoadRoutine}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
        >
          ⚡ Load 1-Tap Routine Template
        </button>
        <button
          onClick={onAdd}
          className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-medium"
        >
          + Add Custom Activity
        </button>
      </div>
    </div>
  );
}

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="text-5xl mb-3">🔍</div>
        <h2 className="text-lg font-semibold">Lesson not found</h2>
        <Link to="/" className="text-sm text-blue-600 mt-2 inline-block">
          ← Back to Now
        </Link>
      </div>
    </div>
  );
}

export function NoStandardBanner({ allStandards, onLink }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800 flex items-center justify-between">
      <span>This lesson has no curriculum standard linked.</span>
      {allStandards.length > 0 && (
        <select
          value=""
          onChange={(e) => e.target.value && onLink(Number(e.target.value))}
          className="text-xs border border-amber-300 rounded-lg px-2 py-1 bg-surface text-slate-800"
        >
          <option value="">Link a standard…</option>
          {allStandards.map((s) => (
            <option key={s.id} value={s.id}>
              {s._subject} · {(s.contentStandard || '').slice(0, 40)}…
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
