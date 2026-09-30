import React, { useState } from 'react';
import { activityRepo } from '../../db/helpers';
import { confirmDialog } from '../../lib/dialogs';
import { ACTIVITY_META } from './LessonScreen';

export default function ActivityBlock({ activity, index, onMoveUp, onMoveDown, onReload }) {
  const meta = ACTIVITY_META[activity.type] || ACTIVITY_META.exercise;
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(activity.title || meta.label);
  const [content, setContent] = useState(activity.content || '');
  const [duration, setDuration] = useState(activity.duration ?? 10);
  const [done, setDone] = useState(!!activity.done);

  const save = async () => {
    await activityRepo.update(activity.id, {
      title: title.trim(),
      content: content.trim(),
      duration: Number(duration) || 0,
    });
    setEditing(false);
    onReload?.();
  };

  const toggleDone = async () => {
    const next = !done;
    setDone(next);
    await activityRepo.update(activity.id, { done: next });
    onReload?.();
  };

  const remove = async () => {
    if (!(await confirmDialog({ title: 'Delete this activity?', confirmLabel: 'Delete', danger: true }))) return;
    await activityRepo.remove(activity.id);
    onReload?.();
  };

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm ${
        done ? 'border-emerald-200 bg-emerald-50/30 opacity-80' : 'border-slate-200'
      } p-4 print:break-inside-avoid`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shrink-0 ${meta.color}`}
        >
          {meta.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider font-semibold">
              {index + 1}. {meta.label}
            </span>
            {activity.duration ? (
              <span className="text-[10px] text-slate-400">{activity.duration} min</span>
            ) : null}
          </div>

          {editing ? (
            <div className="mt-2 space-y-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm"
              />
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm"
                placeholder="What to say / do…"
              />
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500">Minutes</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-16 border border-slate-300 rounded-lg px-2 py-1 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={save}
                  className="px-3 py-1.5 text-xs rounded-lg bg-slate-900 text-white"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-3 py-1.5 text-xs rounded-lg text-slate-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="font-semibold text-slate-800 mt-1">{activity.title}</div>
              {activity.content && (
                <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">
                  {activity.content}
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col items-end gap-1.5 print:hidden shrink-0">
          <div className="flex gap-1">
            <button
              onClick={onMoveUp}
              className="text-slate-400 hover:text-slate-700 text-xs px-1"
            >
              ▲
            </button>
            <button
              onClick={onMoveDown}
              className="text-slate-400 hover:text-slate-700 text-xs px-1"
            >
              ▼
            </button>
          </div>
          <button
            onClick={toggleDone}
            className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${
              done
                ? 'bg-emerald-600 text-white'
                : 'border border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {done ? 'Done' : 'Mark done'}
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(e => !e)}
              className="text-[11px] text-blue-600 hover:underline"
            >
              Edit
            </button>
            <button
              onClick={remove}
              className="text-[11px] text-rose-500 hover:underline"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
