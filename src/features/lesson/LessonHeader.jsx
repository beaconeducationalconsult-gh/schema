import React from 'react';

export default function LessonHeader({ lesson, slot, subject, date, onUpdate }) {
  return (
    <div className="bg-surface rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className="w-2 h-14 rounded-full shrink-0"
          style={{ backgroundColor: subject?.color || '#64748b' }}
        />
        <div className="flex-1 min-w-0">
          <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            {slot?.classLevel || 'Class'} · {formatDate(date)}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 truncate">
            {subject?.name || 'Lesson'}
          </h1>
          {slot && (
            <div className="text-sm text-slate-500 mt-0.5">
              {slot.startTime} – {slot.endTime}
              {slot.room ? ` · ${slot.room}` : ''}
            </div>
          )}
        </div>
        <select
          value={lesson.status || 'planned'}
          onChange={(e) => onUpdate({ status: e.target.value })}
          className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-surface font-medium print:hidden"
        >
          <option value="planned">Planned</option>
          <option value="in_progress">In progress</option>
          <option value="done">Done</option>
          <option value="postponed">Postponed</option>
        </select>
      </div>
    </div>
  );
}

function formatDate(dateKey) {
  if (!dateKey) return '';
  const d = new Date(dateKey + 'T00:00:00');
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
}
