import React, { useState } from 'react';
import { db } from '../../db/schema';

export default function StandardQuickEdit({ standard, onClose, onSaved }) {
  const [content, setContent] = useState(standard.contentStandard || '');
  const [indicator, setIndicator] = useState(standard.indicator || '');
  const save = async () => {
    await db.standards.update(standard.id, {
      contentStandard: content.trim(),
      indicator: indicator.trim(),
    });
    onSaved();
  };
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-5 shadow-xl"
      >
        <h3 className="text-lg font-semibold mb-4">Quick edit standard</h3>
        <label className="text-xs text-slate-500 uppercase font-semibold">
          Content standard
        </label>
        <textarea
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full border border-slate-300 rounded-lg p-2.5 text-sm mb-3 mt-1"
        />
        <label className="text-xs text-slate-500 uppercase font-semibold">
          Indicator
        </label>
        <textarea
          rows={2}
          value={indicator}
          onChange={(e) => setIndicator(e.target.value)}
          className="w-full border border-slate-300 rounded-lg p-2.5 text-sm mt-1"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg text-slate-600"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="px-4 py-2 text-sm rounded-lg bg-primary text-on-primary"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
