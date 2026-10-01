import React, { useState } from 'react';
import { activityRepo } from '../../db/helpers';
import { ACTIVITY_TYPES } from '../../db/schema';
import { toast } from '../../lib/dialogs';
import { ACTIVITY_META } from '../../lib/activityMeta';
import { usePrefs, DEFAULT_PREFS } from '../../hooks/usePrefs';

export default function ActivityPromptBar({ lessonId, standard, onOpenTemplates }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(ACTIVITY_TYPES[0]);
  const [title, setTitle] = useState('');
  const [draft, setDraft] = useState('');
  const prefs = usePrefs();
  const defaultMin = prefs?.defaultActivityMinutes ?? DEFAULT_PREFS.defaultActivityMinutes;
  const [duration, setDuration] = useState(null);

  const openSheet = (type = ACTIVITY_TYPES[0]) => {
    const meta = ACTIVITY_META[type];
    setSelectedType(type);
    setTitle(meta.defaultTitle);
    const exemplarHint = standard?.exemplars?.[0] ? `${standard.exemplars[0]}` : '';
    setDraft(exemplarHint);
    setDuration(null);
    setSheetOpen(true);
  };

  const selectType = (type) => {
    const meta = ACTIVITY_META[type];
    setSelectedType(type);
    // keep title if user hasn't customized, otherwise update to new default
    setTitle(meta.defaultTitle);
  };

  const save = async () => {
    if (!lessonId) return toast.error('No lesson yet for this slot.');
    const meta = ACTIVITY_META[selectedType];
    const payload = {
      lessonId,
      type: selectedType,
      title: title.trim() || meta.defaultTitle,
      content: draft.trim(),
      duration: Number(duration ?? defaultMin) || defaultMin,
      done: false,
    };
    await activityRepo.add(payload);
    setSheetOpen(false);
  };

  const meta = ACTIVITY_META[selectedType];

  return (
    <section className="max-w-3xl mx-auto px-4 pt-3">
      <div className="bg-surface rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Teaching steps
          </div>
          <button
            onClick={onOpenTemplates}
            className="text-xs px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold transition min-h-[36px]"
          >
            ⚡ Use routine
          </button>
        </div>

        <button
          onClick={() => openSheet()}
          className="w-full py-3.5 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 text-slate-700 font-medium text-sm flex items-center justify-center gap-2 transition min-h-[48px]"
        >
          <span className="text-lg leading-none">+</span> Add step
        </button>
        <p className="text-xs text-slate-400 text-center mt-2">
          Add an exercise, discussion, video, or any teaching move
        </p>
      </div>

      {sheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSheetOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5 shadow-xl"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Add teaching step</h3>
              <button
                onClick={() => setSheetOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              Attached to today's lesson ({standard?.indicator?.slice(0, 50) || 'current slot'}).
            </p>

            {/* Type pills — single step, no second modal */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {ACTIVITY_TYPES.map((type) => {
                const m = ACTIVITY_META[type];
                const active = selectedType === type;
                return (
                  <button
                    key={type}
                    onClick={() => selectType(type)}
                    className={`px-2.5 py-2 rounded-full text-xs font-medium border flex items-center gap-1.5 transition min-h-[36px] ${
                      active
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
              Activity Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-slate-400 min-h-[44px]"
              placeholder={meta.defaultTitle}
            />

            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
              Prompt / Instructions
            </label>
            <textarea
              autoFocus
              rows={4}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={meta.placeholder}
              className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />

            <div className="flex items-center gap-3 mt-3">
              <label className="text-sm text-slate-600">Duration (min)</label>
              <input
                type="number"
                min={1}
                max={120}
                value={duration ?? defaultMin}
                onChange={(e) => setDuration(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[44px]"
                aria-label="Duration"
              />
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setSheetOpen(false)}
                className="px-4 py-2.5 text-sm rounded-xl text-slate-600 hover:bg-slate-100 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={save}
                className="px-5 py-2.5 text-sm rounded-xl bg-primary text-on-primary font-medium hover:bg-primary-hover min-h-[44px] disabled:opacity-40"
              >
                Save Activity
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
