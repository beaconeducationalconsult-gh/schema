import React from 'react';

export default function TermsSection({ terms, onChange }) {
  const update = (idx, patch) => {
    const next = terms.map((t, i) => (i === idx ? { ...t, ...patch } : t));
    onChange(next);
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-1">
        📆 Term dates
      </h2>
      <p className="text-xs text-slate-500 mb-3">
        Used by the History filter's "This term" shortcut.
      </p>

      <div className="space-y-3">
        {terms.map((t, i) => (
          <div
            key={i}
            className="grid grid-cols-1 sm:grid-cols-[90px_1fr_1fr] gap-2 items-center"
          >
            <input
              value={t.label}
              onChange={(e) => update(i, { label: e.target.value })}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5"
            />
            <input
              type="date"
              value={t.from}
              onChange={(e) => update(i, { from: e.target.value })}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5"
            />
            <input
              type="date"
              value={t.to}
              onChange={(e) => update(i, { to: e.target.value })}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
