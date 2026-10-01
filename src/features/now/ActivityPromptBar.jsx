import React, { useState } from 'react';
import { activityRepo } from '../../db/helpers';
import { ACTIVITY_TYPES } from '../../db/schema';
import { toast } from '../../lib/dialogs';
import { ACTIVITY_META } from '../../lib/activityMeta';
import { usePrefs, DEFAULT_PREFS } from '../../hooks/usePrefs';

export default function ActivityPromptBar({ lessonId, standard, onOpenTemplates }) {
  const [openType, setOpenType] = useState(null);
  const [title, setTitle] = useState('');
  const [draft, setDraft] = useState('');
  // `null` = not edited, so the field follows Settings → Default activity length.
  const prefs = usePrefs();
  const defaultMin = prefs?.defaultActivityMinutes ?? DEFAULT_PREFS.defaultActivityMinutes;
  const [duration, setDuration] = useState(null);

  const open = (type) => {
    const meta = ACTIVITY_META[type];
    setOpenType(type);
    setTitle(meta.defaultTitle);
    const exemplarHint = standard?.exemplars?.[0]
      ? `${standard.exemplars[0]}`
      : '';
    setDraft(exemplarHint);
    setDuration(null);
  };

  const save = async () => {
    if (!lessonId) return toast.error('No lesson yet for this slot.');
    const meta = ACTIVITY_META[openType];
    const payload = {
      lessonId,
      type: openType,
      title: title.trim() || meta.defaultTitle,
      content: draft.trim(),
      duration: Number(duration ?? defaultMin) || defaultMin,
      done: false,
    };
    await activityRepo.add(payload);
    setOpenType(null);
  };

  return (
    <section className="max-w-3xl mx-auto px-4 pt-3">
      <div className="bg-surface rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            🎯 How I'm Teaching — Quick Prompt Bar
          </div>
          <button
            onClick={onOpenTemplates}
            className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold transition"
          >
            ⚡ 1-Tap Routine
          </button>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {ACTIVITY_TYPES.map((type) => {
            const m = ACTIVITY_META[type];
            return (
              <button
                key={type}
                onClick={() => open(type)}
                className={`${m.color} ${m.hover} text-white rounded-xl py-3 px-2 text-xs font-medium flex flex-col items-center gap-1 transition active:scale-95 shadow-sm`}
              >
                <span className="text-xl">{m.emoji}</span>
                <span className="truncate max-w-full">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {openType && (
        <Modal onClose={() => setOpenType(null)}>
          <h3 className="text-lg font-semibold mb-1">
            {ACTIVITY_META[openType].emoji} {ACTIVITY_META[openType].label}
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Attached to today's lesson ({standard?.indicator?.slice(0, 50) || 'current slot'}).
          </p>

          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
            Activity Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-slate-400"
            placeholder={ACTIVITY_META[openType].defaultTitle}
          />

          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
            Prompt / Instructions
          </label>
          <textarea
            autoFocus
            rows={4}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={ACTIVITY_META[openType].placeholder}
            className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />

          <div className="flex items-center gap-3 mt-3">
            <label className="text-xs text-slate-600">Duration (min)</label>
            <input
              type="number"
              min={1}
              max={120}
              value={duration ?? defaultMin}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setOpenType(null)}
              className="px-4 py-2 text-sm rounded-lg text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={!draft.trim() && !title.trim()}
              className="px-4 py-2 text-sm rounded-lg bg-primary text-on-primary disabled:opacity-40"
            >
              Save Activity
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}

function Modal({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-5 shadow-xl"
      >
        {children}
      </div>
    </div>
  );
}
