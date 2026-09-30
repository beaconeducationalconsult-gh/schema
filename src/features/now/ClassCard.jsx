import React from 'react';
import { Link } from 'react-router-dom';
import { DAY_NAMES } from '../../lib/dayNames';

export default function ClassCard({ slot, subject, lesson, isPreviewMode, onCompleteLesson }) {
  return (
    <section className="max-w-3xl mx-auto px-4 pt-4">
      <div className="bg-surface rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center gap-3">
          <span
            className="w-3 h-14 rounded-full shrink-0"
            style={{ backgroundColor: subject?.color || '#475569' }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {slot.classLevel}
              </span>
              {isPreviewMode && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                  {DAY_NAMES[slot.dayOfWeek]} Slot
                </span>
              )}
              {lesson?.status === 'done' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold uppercase">
                  Completed
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 truncate">
              {subject?.name || 'Unknown subject'}
            </h1>
            <div className="text-sm text-slate-600 mt-0.5">
              {slot.startTime} – {slot.endTime}
              {slot.room && <> · <span className="font-medium">{slot.room}</span></>}
            </div>
          </div>

          {lesson && (
            <div className="hidden sm:flex flex-col gap-1.5 shrink-0">
              <Link
                to={`/lesson/${lesson.id}`}
                className="px-3.5 py-2 rounded-xl bg-primary text-on-primary text-xs font-medium text-center hover:bg-primary-hover"
              >
                Open Lesson Plan
              </Link>
              <div className="flex gap-1.5">
                <Link
                  to={`/lesson/${lesson.id}?guided=1`}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-medium text-center hover:bg-blue-700"
                >
                  ▶ Guided
                </Link>
                <button
                  onClick={onCompleteLesson}
                  title="Mark taught & advance standard"
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
                >
                  ✓ Wrap Up
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
