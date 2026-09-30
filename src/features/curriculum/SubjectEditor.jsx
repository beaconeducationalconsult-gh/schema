import React, { useState } from 'react';
import { subjects as subjectRepo } from '../../db/helpers';
import { confirmDialog } from '../../lib/dialogs';
import { db } from '../../db/schema';
import { deleteStrand } from '../../db/curriculum';

const COLORS = ['#2563eb','#dc2626','#16a34a','#9333ea','#ea580c','#0891b2','#4f46e5','#be185d'];
const ICONS  = ['sigma','book','flask','globe','music','palette','code','leaf'];

export default function SubjectEditor({ subject, onClose, onSaved }) {
  const [name, setName] = useState(subject?.name || '');
  const [color, setColor] = useState(subject?.color || COLORS[0]);
  const [icon, setIcon] = useState(subject?.icon || ICONS[0]);

  const save = async () => {
    if (!name.trim()) return;
    if (subject) {
      await subjectRepo.update(subject.id, { name: name.trim(), color, icon });
    } else {
      const all = await subjectRepo.all();
      await subjectRepo.add({ name: name.trim(), color, icon, order: all.length });
    }
    onSaved?.();
    onClose();
  };

  const remove = async () => {
    if (!subject) return;
    const ok = await confirmDialog({
      title: `Delete "${subject.name}"?`,
      message: 'All its strands, sub-strands and standards will be deleted too.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    const strands = await db.strands.where('subjectId').equals(subject.id).toArray();
    for (const s of strands) await deleteStrand(s.id);
    await subjectRepo.remove(subject.id);
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
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 shadow-xl"
      >
        <h3 className="text-lg font-semibold mb-4">
          {subject ? 'Edit Subject' : 'New Subject'}
        </h3>

        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
          Name
        </label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-slate-400"
          placeholder="e.g. Mathematics"
        />

        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
          Color
        </label>
        <div className="flex gap-2 flex-wrap mb-4">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full border-2 ${
                color === c ? 'border-slate-900 scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
          Icon Tag
        </label>
        <div className="flex gap-2 flex-wrap mb-5">
          {ICONS.map(ic => (
            <button
              key={ic}
              onClick={() => setIcon(ic)}
              className={`px-2.5 py-1 rounded-lg text-xs border ${
                icon === ic
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'border-slate-200 text-slate-600'
              }`}
            >
              {ic}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center">
          {subject ? (
            <button onClick={remove} className="text-sm text-rose-500 hover:underline">
              Delete
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={!name.trim()}
              className="px-4 py-2 text-sm rounded-lg bg-slate-900 text-white disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
