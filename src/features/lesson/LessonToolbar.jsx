import React from 'react';
import { Link } from 'react-router-dom';
import { toast } from '../../lib/dialogs';

export default function LessonToolbar({ data, onRoutine, onAddActivity, onComplete }) {
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;
  const doShare = async () => {
    if (!data) return;
    const { lesson, subject, standard, activities = [] } = data;
    const title = `${subject?.name || 'Lesson'} — ${standard?.indicator?.slice(0, 60) || lesson.date}`;
    const lines = [
      title,
      `Date: ${lesson.date} · ${lesson.status || ''}`.trim(),
      standard ? `Standard: ${standard.contentStandard}` : '',
      standard?.indicator ? `Indicator: ${standard.indicator}` : '',
      '',
      'Teaching steps:',
      ...activities.map((a, i) => `${i + 1}. ${a.title} (${a.duration || 0} min)${a.content ? ` — ${a.content.slice(0, 80)}` : ''}`),
    ].filter(Boolean).join('\n');
    try {
      if (navigator.share) {
        await navigator.share({ title, text: lines });
      } else {
        await navigator.clipboard.writeText(lines);
        toast.success('Lesson copied to clipboard');
      }
    } catch (e) {
      if (e?.name !== 'AbortError') toast.error(e.message || 'Could not share');
    }
  };
  return (
    <header className="bg-surface border-b border-slate-200 sticky top-0 z-10 print:hidden">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
        <Link to="/" className="text-sm text-slate-600 hover:text-slate-900 font-medium">
          ← Now
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          {canShare && (
            <button
              onClick={doShare}
              className="px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
              title="Share lesson plan"
            >
              ↗ Share
            </button>
          )}
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
