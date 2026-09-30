import React, { useState } from 'react';
import { ROUTINE_TEMPLATES } from '../lib/routineTemplates';
import { activities as activityRepo } from '../db/helpers';
import { db } from '../db/schema';

const EMOJI_MAP = {
  exercise: '✏️',
  correction: '✅',
  image_observation: '🖼️',
  video: '🎬',
  reading: '📖',
  discussion: '💬',
  assignment: '📝',
};

export default function RoutineTemplateModal({
  lessonId,
  standard,
  hasExistingActivities = false,
  onClose,
  onApplied,
}) {
  const [selectedId, setSelectedId] = useState(ROUTINE_TEMPLATES[0].id);
  const [busy, setBusy] = useState(false);

  const selected = ROUTINE_TEMPLATES.find(t => t.id === selectedId) || ROUTINE_TEMPLATES[0];
  const previewItems = selected.build(standard);

  const applyTemplate = async (mode = 'append') => {
    if (!lessonId) return;
    setBusy(true);
    try {
      if (mode === 'replace') {
        await db.activities.where('lessonId').equals(lessonId).delete();
      }
      const updated = await activityRepo.bulkAddForLesson(lessonId, previewItems);
      onApplied?.(updated);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface w-full sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              ⚡ 1-Tap Lesson Routine Templates
            </h3>
            <p className="text-xs text-slate-500">
              Pre-fills a complete sequence of teaching moves using your current NaCCA indicator & exemplars.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-sm px-2"
          >
            ✕
          </button>
        </div>

        {/* Template selector cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          {ROUTINE_TEMPLATES.map(tpl => {
            const active = tpl.id === selectedId;
            return (
              <button
                key={tpl.id}
                onClick={() => setSelectedId(tpl.id)}
                className={`text-left p-3 rounded-xl border transition ${
                  active
                    ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:border-slate-300 bg-surface'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-900">{tpl.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-on-primary shrink-0">
                    {tpl.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                  {tpl.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Preview of generated activities */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 mb-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Preview Generated Sequence ({previewItems.length} moves)
          </div>
          <ol className="space-y-2">
            {previewItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs bg-surface p-2.5 rounded-lg border border-slate-200/80">
                <span className="text-base leading-none mt-0.5">
                  {EMOJI_MAP[item.type] || '📌'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 flex items-center justify-between">
                    <span>{i + 1}. {item.title}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {item.duration} min
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5 line-clamp-2 whitespace-pre-wrap">
                    {item.content}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-xl text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          {hasExistingActivities && (
            <button
              onClick={() => applyTemplate('replace')}
              disabled={busy}
              className="px-4 py-2 text-sm rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
            >
              Replace Current Plan
            </button>
          )}
          <button
            onClick={() => applyTemplate('append')}
            disabled={busy}
            className="px-4 py-2 text-sm rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            ⚡ {hasExistingActivities ? 'Append Routine' : 'Load Routine into Lesson'}
          </button>
        </div>
      </div>
    </div>
  );
}
