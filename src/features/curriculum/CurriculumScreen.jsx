import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { subjects as subjectRepo, settings } from '../../db/helpers';
import { subjectStats } from '../../db/curriculum';
import SubjectTree from './SubjectTree';
import SubjectEditor from './SubjectEditor';
import BulkImportModal from './BulkImportModal';

export default function CurriculumScreen() {
  // Everything below is live: add a subject, import standards, tweak the
  // "current standard" from the Now screen… and this screen follows along.
  const subjects = useLiveQuery(() => subjectRepo.all(), [], []);
  const currentStdMap = useLiveQuery(
    () => settings.get('currentStandardBySubject', {}),
    [],
    {}
  );
  const stats = useLiveQuery(async () => {
    const out = {};
    for (const sub of await subjectRepo.all()) out[sub.id] = await subjectStats(sub.id);
    return out;
  }, [], {});

  const [pickedId, setActiveId] = useState(null);
  const activeId = subjects.some(s => s.id === pickedId) ? pickedId : subjects[0]?.id ?? null;
  const [editingSubject, setEditingSubject] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const active = subjects.find(s => s.id === activeId) || null;

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="bg-surface border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Curriculum Catalogue</h1>
            <p className="text-xs text-slate-500">
              Subject → Strand → Sub-strand → Content Standard & Indicators
            </p>
          </div>
          <div className="flex items-center gap-2">
            {active && (
              <button
                onClick={() => setBulkOpen(true)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50"
              >
                ⬆ Bulk CSV
              </button>
            )}
            <button
              onClick={() => setEditingSubject({ isNew: true })}
              className="px-3 py-2 rounded-lg bg-primary text-on-primary text-xs font-medium"
            >
              + Subject
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
          {subjects.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap border transition ${
                activeId === s.id
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span
                className="inline-block w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: s.color }}
              />
              {s.name}
              {stats[s.id]?.standards ? (
                <span className="ml-2 text-[10px] opacity-70">
                  {stats[s.id].standards}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-4">
        {active ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-slate-500">
                {stats[active.id]?.strands || 0} strands ·{' '}
                {stats[active.id]?.subStrands || 0} sub-strands ·{' '}
                {stats[active.id]?.standards || 0} standards
              </div>
              <button
                onClick={() => setEditingSubject(active)}
                className="text-xs text-slate-600 hover:underline font-medium"
              >
                Edit subject
              </button>
            </div>

            <SubjectTree
              key={active.id}
              subject={active}
              currentStandardId={currentStdMap[active.id]}
              onSetCurrent={(stdId) => settings.setCurrentStandard(active.id, stdId)}
            />
          </>
        ) : (
          <EmptyState onAdd={() => setEditingSubject({ isNew: true })} />
        )}
      </main>

      {editingSubject && (
        <SubjectEditor
          subject={editingSubject.isNew ? null : editingSubject}
          onClose={() => setEditingSubject(null)}
        />
      )}

      {bulkOpen && active && (
        <BulkImportModal
          subject={active}
          onClose={() => setBulkOpen(false)}
          onImported={() => setBulkOpen(false)}
        />
      )}
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-3">📚</div>
      <h2 className="text-lg font-semibold">No subjects yet</h2>
      <p className="text-sm text-slate-500 mt-1">Start by adding a subject.</p>
      <button
        onClick={onAdd}
        className="mt-4 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm"
      >
        + Add Subject
      </button>
    </div>
  );
}
