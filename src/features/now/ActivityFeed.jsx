import React from 'react';
import { Link } from 'react-router-dom';
import { ACTIVITY_META } from '../../lib/activityMeta';

export default function ActivityFeed({ items, lessonId, onToggleDone, onCompleteLesson }) {
  const totalMin = items.reduce((s, a) => s + (a.duration || 0), 0);
  const doneCount = items.filter(a => a.done).length;

  return (
    <section className="max-w-3xl mx-auto px-4 pt-3">
      <div className="bg-surface rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            📋 Lesson Activities ({doneCount}/{items.length} done · {totalMin} min)
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onCompleteLesson}
              className="text-xs text-emerald-700 font-semibold hover:underline"
            >
              ✓ Complete & Advance
            </button>
            {lessonId && (
              <Link
                to={`/lesson/${lessonId}`}
                className="text-xs text-blue-600 font-medium hover:underline"
              >
                Edit Plan →
              </Link>
            )}
          </div>
        </div>
        <ol className="space-y-2.5">
          {items
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((a, idx) => {
              const m = ACTIVITY_META[a.type];
              return (
                <li
                  key={a.id}
                  className={`flex gap-3 items-start p-2.5 rounded-xl border transition ${
                    a.done
                      ? 'bg-emerald-50/50 border-emerald-200 opacity-75'
                      : 'bg-slate-50/70 border-slate-200/80'
                  }`}
                >
                  <button
                    onClick={() => onToggleDone?.(a)}
                    title={a.done ? 'Mark undone' : 'Mark done'}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs mt-0.5 border shrink-0 ${
                      a.done
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-surface border-slate-300 text-transparent hover:border-slate-500'
                    }`}
                  >
                    ✓
                  </button>
                  <span className="text-lg leading-none mt-0.5">{m?.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 flex items-center gap-2">
                      <span className={a.done ? 'line-through text-slate-500' : ''}>
                        {idx + 1}. {a.title}
                      </span>
                      {a.duration ? (
                        <span className="text-[11px] text-slate-400 font-normal">
                          {a.duration} min
                        </span>
                      ) : null}
                    </div>
                    {a.content && (
                      <div className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                        {a.content}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
        </ol>
      </div>
    </section>
  );
}
