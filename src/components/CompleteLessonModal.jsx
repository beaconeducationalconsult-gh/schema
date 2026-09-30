import React, { useEffect, useState } from 'react';
import {
  getNextStandardForSubject,
  advanceSubjectStandard,
} from '../db/curriculum';
import {
  lessonsFull,
  notes as noteRepo,
  settings as settingsRepo,
} from '../db/helpers';
import { db } from '../db/schema';

export default function CompleteLessonModal({
  data,
  onClose,
  onCompleted,
}) {
  const { lesson, subject, standard, activities = [] } = data;
  const [progression, setProgression] = useState(null);
  const [choice, setChoice] = useState('advance'); // 'advance' | 'continue'
  const [reflection, setReflection] = useState('');
  const [tag, setTag] = useState('insight');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!subject?.id) return;
    getNextStandardForSubject(subject.id, standard?.id).then(info => {
      setProgression(info);
      if (!info.next) {
        setChoice('continue');
      }
    });
  }, [subject?.id, standard?.id]);

  const unfinishedCount = activities.filter(a => !a.done).length;

  const handleConfirm = async () => {
    setBusy(true);
    try {
      // 1. Mark lesson status as done
      await lessonsFull.update(lesson.id, { status: 'done' });

      // 2. If user jotted a post-lesson reflection, save it to notes
      if (reflection.trim()) {
        await noteRepo.add({
          lessonId: lesson.id,
          standardId: standard?.id || null,
          body: reflection.trim(),
          tags: [tag, choice === 'advance' ? 'mastered' : 'continue-next'],
        });
      }

      // 3. Handle curriculum pointer progression
      let nextStd = null;
      if (choice === 'advance' && subject?.id && progression?.next) {
        // Mark all activities done
        await db.transaction('rw', db.activities, async () => {
          for (const a of activities) {
            if (!a.done) await db.activities.update(a.id, { done: true });
          }
        });
        nextStd = await advanceSubjectStandard(subject.id, standard?.id);
      } else if (choice === 'continue' && subject?.id && standard?.id) {
        // Ensure pointer stays on current standard for next class
        await settingsRepo.setCurrentStandard(subject.id, standard.id);
      }

      onCompleted?.({ choice, nextStd });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 text-slate-900"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
            🎓 Lesson Wrap-Up & Progression
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-sm px-2"
          >
            ✕
          </button>
        </div>

        <h3 className="text-lg font-bold text-slate-900">
          Did the class master this indicator?
        </h3>
        <p className="text-xs text-slate-500 mt-0.5 mb-4">
          Decide what the NOW screen and your next <b>{subject?.name}</b> lesson should queue up.
        </p>

        {/* Current Standard box */}
        {standard && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase text-slate-400">
              <span>Current Indicator</span>
              {progression?.total > 0 && (
                <span>
                  Standard {progression.index + 1} of {progression.total} in {subject?.name}
                </span>
              )}
            </div>
            <div className="text-xs font-medium text-slate-800 mt-1">
              {standard.indicator || standard.contentStandard}
            </div>
          </div>
        )}

        {/* Progression choices */}
        <div className="space-y-2.5 mb-4">
          <button
            type="button"
            disabled={!progression?.next}
            onClick={() => setChoice('advance')}
            className={`w-full text-left p-3.5 rounded-xl border transition flex items-start gap-3 ${
              choice === 'advance'
                ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600'
                : 'border-slate-200 hover:border-slate-300'
            } ${!progression?.next ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="text-xl mt-0.5">⏭️</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-900">
                Mastered — Advance to Next Standard
              </div>
              {progression?.next ? (
                <div className="text-xs text-emerald-800 mt-1">
                  <b>Next up:</b> {progression.next.subStrand?.name} →{' '}
                  {progression.next.standard.indicator ||
                    progression.next.standard.contentStandard}
                </div>
              ) : (
                <div className="text-xs text-slate-500 mt-1">
                  You are on the final standard in {subject?.name}.
                </div>
              )}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setChoice('continue')}
            className={`w-full text-left p-3.5 rounded-xl border transition flex items-start gap-3 ${
              choice === 'continue'
                ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="text-xl mt-0.5">🔁</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-900">
                Continue This Standard Next Class
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Keeps this indicator active for the next {subject?.name} slot
                {unfinishedCount > 0
                  ? ` (${unfinishedCount} unfinished activity move${unfinishedCount === 1 ? '' : 's'} remain).`
                  : '.'}
              </div>
            </div>
          </button>
        </div>

        {/* Quick Post-Lesson Reflection Note */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              📝 Post-Lesson Reflection Note (optional)
            </label>
            <div className="flex gap-1">
              {['insight', 'remedial', 'homework', 'absent'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(t)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    tag === t
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-500 border-slate-200'
                  }`}
                >
                  #{t}
                </button>
              ))}
            </div>
          </div>
          <textarea
            rows={2}
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="e.g. Group 2 needs more practice with unlike denominators…"
            className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-40"
          >
            {busy
              ? 'Saving…'
              : choice === 'advance'
                ? '✓ Complete & Advance Standard'
                : '✓ Complete & Keep Standard'}
          </button>
        </div>
      </div>
    </div>
  );
}
