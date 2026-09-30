import React, { useState } from 'react';
import { activityRepo } from '../../db/helpers';
import { ACTIVITY_TYPES } from '../../db/schema';
import { ACTIVITY_META } from '../../lib/activityMeta';

export default function ActivityPicker({ lessonId, onClose, onAdded }) {
  const [type, setType] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [duration, setDuration] = useState(10);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!type) return;
    setSaving(true);
    await activityRepo.add({
      lessonId,
      type,
      title: title.trim() || ACTIVITY_META[type].label,
      content: content.trim(),
      duration: Number(duration) || 10,
      done: false,
    });
    setSaving(false);
    onAdded?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5 shadow-xl"
      >
        {!type ? (
          <>
            <h3 className="text-lg font-semibold mb-4">Choose activity type</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ACTIVITY_TYPES.map(t => {
                const m = ACTIVITY_META[t];
                return (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`${m.color} text-white rounded-xl py-4 flex flex-col items-center gap-1`}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="text-xs font-medium">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setType(null)} className="text-sm text-slate-500">
                ←
              </button>
              <h3 className="text-lg font-semibold">
                {ACTIVITY_META[type].emoji} {ACTIVITY_META[type].label}
              </h3>
            </div>

            <label className="text-xs text-slate-500 uppercase font-semibold">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={ACTIVITY_META[type].label}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-3 mt-1"
            />

            <label className="text-xs text-slate-500 uppercase font-semibold">Content</label>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What should you say or do?"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-3 mt-1"
            />

            <label className="block text-xs text-slate-500 uppercase font-semibold">
              Duration (min)
            </label>
            <input
              type="number"
              min={1}
              max={120}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-24 border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4 mt-1"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-lg text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-on-primary disabled:opacity-40"
              >
                {saving ? 'Saving…' : 'Add activity'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
