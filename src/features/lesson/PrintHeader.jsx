import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getSettings } from '../../db/settings';

export default function PrintHeader({ data }) {
  const { subject, slot, lesson, standard } = data;
  const profile = useLiveQuery(getSettings, []);
  if (!subject) return null;
  const byline = [profile?.schoolName, profile?.teacherName, profile?.academicYear]
    .filter(Boolean)
    .join(' · ');
  return (
    <div className="hidden print:block p-6 border-b border-slate-300">
      <div className="text-xs uppercase tracking-wider text-slate-500">
        Lesson Plan{byline ? ` — ${byline}` : ''}
      </div>
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
