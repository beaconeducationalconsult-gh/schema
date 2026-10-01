import React from 'react';
import { Link } from 'react-router-dom';

export default function LessonToolbar({ onRoutine, onAddActivity, onComplete }) {
  return (
    <header className="bg-surface border-b border-slate-200 sticky top-0 z-10 print:hidden">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
        <Link to="/" className="text-sm text-slate-600 hover:text-slate-900 font-medium">
          ← Now
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            🖨️ Print
          </button>
          <button
            onClick={() => onRoutine()}
            className="px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-blue-200 bg-blue-50 text-blue-700 font-medium hover:bg-blue-100"
          >
            ⚡ 1-Tap Routine
          </button>
          <button
            onClick={() => onAddActivity()}
            className="px-3 py-1.5 text-xs sm:text-sm rounded-lg bg-primary text-on-primary font-medium"
          >
            + Activity
          </button>
          <button
            onClick={() => onComplete()}
            className="px-3 py-1.5 text-xs sm:text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            ✓ Complete Lesson
          </button>
        </div>
      </div>
    </header>
  );
}
