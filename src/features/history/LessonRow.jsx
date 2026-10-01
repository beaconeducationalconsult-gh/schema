import React from 'react';
import { Link } from 'react-router-dom';
import { ACTIVITY_META } from '../../lib/activityMeta';

const STATUS_STYLES = {
  planned:     'bg-slate-100 text-slate-600',
  in_progress: 'bg-amber-100 text-amber-700',
  done:        'bg-emerald-100 text-emerald-700',
  postponed:   'bg-rose-100 text-rose-700',
};

export default function LessonRow({ row }) {
  const { lesson, slot, subject, standard, activities, notes, totalMin, doneCount } = row;

  return (
    <li className="bg-surface rounded-2xl border border-slate-200 hover:border-slate-300 transition shadow-sm">
      <Link to={`/lesson/${lesson.id}`} className="block p-4">
        <div className="flex items-start gap-3">
          <span
            className="w-1.5 h-12 rounded-full mt-0.5 shrink-0"
            style={{ backgroundColor: subject?.color || '#94a3b8' }}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-slate-600">
                {formatDate(lesson.date)}
              </span>
              {slot && (
                <>
                  <span className="text-[10px] text-slate-400">·</span>
                  <span className="text-xs text-slate-500">
                    {slot.startTime}–{slot.endTime}
                  </span>
                </>
              )}
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-medium ${
                  STATUS_STYLES[lesson.status || 'planned']
                }`}
              >
                {(lesson.status || 'planned').replace('_', ' ')}
              </span>
            </div>

            <div className="font-semibold text-slate-800 mt-0.5 truncate">
              {subject?.name || 'Lesson'}
            </div>

            {standard?.indicator && (
              <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                {standard.indicator}
              </div>
            )}

            {activities.length > 0 && (
              <div className="flex items-center gap-1 mt-2 flex-wrap">
                {activities.slice(0, 6).map(a => {
                  const m = ACTIVITY_META[a.type];
                  return (
                    <span
                      key={a.id}
                      title={a.title}
                      className={`text-[11px] px-1.5 py-0.5 rounded ${
                        a.done ? 'bg-emerald-100' : 'bg-slate-100'
                      } text-slate-600`}
                    >
                      {m?.emoji}
                    </span>
                  );
                })}
                {activities.length > 6 && (
                  <span className="text-[10px] text-slate-400">+{activities.length - 6}</span>
                )}
                <span className="text-[10px] text-slate-400 ml-1">
                  {doneCount}/{activities.length} done
                  {totalMin ? ` · ${totalMin} min` : ''}
                </span>
                {notes.length > 0 && (
                  <span className="text-[10px] text-slate-400 ml-1">
                    · 📝 {notes.length}
                  </span>
                )}
              </div>
            )}
          </div>

          <span className="text-slate-300">›</span>
        </div>
      </Link>
    </li>
  );
}

function formatDate(dateKey) {
  if (!dateKey) return '';
  const d = new Date(dateKey + 'T00:00:00');
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}
