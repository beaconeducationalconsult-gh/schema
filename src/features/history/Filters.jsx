import React from 'react';

const RANGES = [
  { id: 'week',   label: 'This week' },
  { id: 'month',  label: 'This month' },
  { id: 'term',   label: 'This term' },
  { id: 'all',    label: 'All time' },
  { id: 'custom', label: 'Custom' },
];

const STATUSES = [
  { id: null,          label: 'Any status' },
  { id: 'planned',     label: 'Planned' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'done',        label: 'Done' },
  { id: 'postponed',   label: 'Postponed' },
];

export default function Filters({ filters, setFilters, subjects }) {
  const set = (patch) => setFilters(f => ({ ...f, ...patch }));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-sm">
      <div className="flex gap-1.5 flex-wrap">
        {RANGES.map(r => (
          <button
            key={r.id}
            onClick={() => set({ range: r.id })}
            className={`px-3 py-1.5 rounded-full text-xs border transition ${
              filters.range === r.id
                ? 'bg-slate-900 text-white border-slate-900 font-medium'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {filters.range === 'custom' && (
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={filters.from}
            onChange={(e) => set({ from: e.target.value })}
            className="text-xs border border-slate-300 rounded-lg px-2 py-1"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => set({ to: e.target.value })}
            className="text-xs border border-slate-300 rounded-lg px-2 py-1"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <select
          value={filters.subjectId ?? ''}
          onChange={(e) => set({ subjectId: e.target.value ? Number(e.target.value) : null })}
          className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white"
        >
          <option value="">All subjects</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select
          value={filters.status ?? ''}
          onChange={(e) => set({ status: e.target.value || null })}
          className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white"
        >
          {STATUSES.map(s => (
            <option key={String(s.id)} value={s.id ?? ''}>{s.label}</option>
          ))}
        </select>

        <select
          value={filters.sort}
          onChange={(e) => set({ sort: e.target.value })}
          className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white"
        >
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>

        <input
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
          placeholder="Search indicator, subject, notes…"
          className="flex-1 min-w-[180px] text-xs border border-slate-300 rounded-lg px-3 py-1.5"
        />
      </div>
    </div>
  );
}
