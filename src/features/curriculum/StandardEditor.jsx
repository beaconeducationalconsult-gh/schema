import React, { useState } from 'react';
import { db } from '../../db/schema';

export default function StandardEditor({ standard, onClose, onSaved }) {
  const [contentStandard, setContentStandard] = useState(standard.contentStandard || '');
  const [indicator, setIndicator] = useState(standard.indicator || '');
  const [exemplars, setExemplars] = useState(
    (standard.exemplars || []).length ? standard.exemplars : ['']
  );

  const addExemplar = () => setExemplars([...exemplars, '']);
  const removeExemplar = (i) => setExemplars(exemplars.filter((_, idx) => idx !== i));
  const updateExemplar = (i, v) =>
    setExemplars(exemplars.map((e, idx) => (idx === i ? v : e)));

  const save = async () => {
    const clean = exemplars.map(e => e.trim()).filter(Boolean);
    await db.standards.update(standard.id, {
      contentStandard: contentStandard.trim(),
      indicator: indicator.trim(),
      exemplars: clean,
    });
    onSaved?.();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5 shadow-xl"
      >
        <h3 className="text-lg font-semibold mb-4">Edit Standard</h3>

        <Field label="Content Standard">
          <textarea
            rows={3}
            value={contentStandard}
            onChange={(e) => setContentStandard(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            placeholder="Learners will be able to…"
          />
        </Field>

        <Field label="Indicator">
          <textarea
            rows={2}
            value={indicator}
            onChange={(e) => setIndicator(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            placeholder="Specifically, they can…"
          />
        </Field>

        <Field label="Exemplars">
          <div className="space-y-2">
            {exemplars.map((e, i) => (
              <div key={i} className="flex gap-2">
                <textarea
                  rows={2}
                  value={e}
                  onChange={(ev) => updateExemplar(i, ev.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder={`Exemplar ${i + 1}`}
                />
                {exemplars.length > 1 && (
                  <button
                    onClick={() => removeExemplar(i)}
                    className="text-rose-500 text-sm px-2"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button onClick={addExemplar} className="text-xs text-blue-600 font-medium">
              + Add exemplar
            </button>
          </div>
        </Field>

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="px-4 py-2 text-sm rounded-lg bg-slate-900 text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-4">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
        {label}
      </div>
      {children}
    </div>
  );
}
