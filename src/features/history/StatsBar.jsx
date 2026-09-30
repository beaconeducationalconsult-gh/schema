import React from 'react';
import { ACTIVITY_META } from '../lesson/LessonScreen';

export default function StatsBar({ stats }) {
  const topTypes = Object.entries(stats.byActivityType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-sm">
      <div className="grid grid-cols-3 gap-2">
        <Tile label="Lessons" value={stats.totalLessons} />
        <Tile label="Completed" value={stats.completed} accent />
        <Tile label="Minutes" value={stats.totalMin} />
      </div>

      {Object.keys(stats.bySubject).length > 0 && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            By subject
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(stats.bySubject)
              .sort((a, b) => b[1] - a[1])
              .map(([name, count]) => (
                <span
                  key={name}
                  className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-medium"
                >
                  {name} · {count}
                </span>
              ))}
          </div>
        </div>
      )}

      {topTypes.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Teaching moves
          </div>
          <div className="flex flex-wrap gap-1.5">
            {topTypes.map(([type, count]) => {
              const m = ACTIVITY_META[type];
              return (
                <span
                  key={type}
                  className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full"
                >
                  {m?.emoji} {m?.label} · {count}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {stats.byStandard.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Most-taught standards
          </div>
          <ul className="text-xs text-slate-600 space-y-1">
            {stats.byStandard.slice(0, 3).map((s, i) => (
              <li key={i} className="truncate">
                <span className="text-slate-400 font-medium">{s.count}×</span>{' '}
                {s.indicator || '(no indicator)'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Tile({ label, value, accent }) {
  return (
    <div className={`rounded-xl p-3 text-center ${accent ? 'bg-emerald-50' : 'bg-slate-50'}`}>
      <div className={`text-2xl font-bold ${accent ? 'text-emerald-700' : 'text-slate-800'}`}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5 font-medium">
        {label}
      </div>
    </div>
  );
}
