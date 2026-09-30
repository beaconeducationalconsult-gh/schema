import React from 'react';

export default function PrintHeader({ data }) {
  const { subject, slot, lesson, standard } = data;
  if (!subject) return null;
  return (
    <div className="hidden print:block p-6 border-b border-slate-300">
      <div className="text-xs uppercase tracking-wider text-slate-500">Lesson Plan</div>
      <h1 className="text-2xl font-bold">{subject.name}</h1>
      <div className="text-sm text-slate-600 mt-1">
        {slot?.classLevel} · {lesson.date} · {slot?.startTime}–{slot?.endTime}
        {slot?.room ? ` · ${slot.room}` : ''}
      </div>
      {standard && (
        <div className="text-xs text-slate-500 mt-2">
          <b>Indicator:</b> {standard.indicator}
        </div>
      )}
    </div>
  );
}
