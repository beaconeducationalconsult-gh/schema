import React, { useState } from 'react';
import { activityRepo } from '../../db/helpers';
import { ACTIVITY_TYPES } from '../../db/schema';
import { ACTIVITY_META } from '../../lib/activityMeta';
import { usePrefs, DEFAULT_PREFS } from '../../hooks/usePrefs';

export default function ActivityPicker({ lessonId, onClose, onAdded }) {
  const prefs = usePrefs();
  const defaultMin = prefs?.defaultActivityMinutes ?? DEFAULT_PREFS.defaultActivityMinutes;
  const [type, setType] = useState(ACTIVITY_TYPES[0]);
  const [title, setTitle] = useState(ACTIVITY_META[ACTIVITY_TYPES[0]].defaultTitle);
  const [content, setContent] = useState('');
  const [duration, setDuration] = useState(null);
  const [saving, setSaving] = useState(false);

  const pickType = (t) => {
    setType(t);
    setTitle(ACTIVITY_META[t].defaultTitle);
  };

  const save = async () => {
    if (!type) return;
    setSaving(true);
    await activityRepo.add({
      lessonId,
      type,
      title: title.trim() || ACTIVITY_META[type].label,
      content: content.trim(),
      duration: Number(duration ?? defaultMin) || defaultMin,
      done: false,
    });
    setSaving(false);
    onAdded?.();
  };

  const meta = ACTIVITY_META[type];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5 shadow-xl"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Add teaching step</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {ACTIVITY_TYPES.map((t) => {
            const m = ACTIVITY_META[t];
            const active = type === t;
            return (
              <button
                key={t}
                onClick={() => pickType(t)}
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

        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={meta.defaultTitle}
          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-slate-400 min-h-[44px]"
        />

        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Prompt / Instructions</label>
        <textarea
          autoFocus
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={meta.placeholder}
          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-slate-400"
        />

        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Duration (min)</label>
        <input
          type="number"
          min={1}
          max={120}
          value={duration ?? defaultMin}
          onChange={(e) => setDuration(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-24 border border-slate-300 rounded-lg px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-slate-400 min-h-[44px]"
          aria-label="Duration"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm rounded-xl text-slate-600 hover:bg-slate-100 min-h-[44px]"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-5 py-2.5 text-sm rounded-xl bg-primary text-on-primary font-medium hover:bg-primary-hover disabled:opacity-40 min-h-[44px]"
          >
            {saving ? 'Saving…' : 'Add activity'}
          </button>
        </div>
      </div>
    </div>
  );
}
