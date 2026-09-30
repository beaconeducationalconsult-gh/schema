import React, { useEffect, useState } from 'react';
import { subjects as subjectRepo, settings } from '../../db/helpers';
import { subjectStats } from '../../db/curriculum';
import SubjectTree from './SubjectTree';
import SubjectEditor from './SubjectEditor';
import BulkImportModal from './BulkImportModal';

export default function CurriculumScreen() {
  const [subjects, setSubjects] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [currentStdMap, setCurrentStdMap] = useState({});
  const [editingSubject, setEditingSubject] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [stats, setStats] = useState({});
  const [treeKey, setTreeKey] = useState(0);

  async function reload() {
    const list = await subjectRepo.all();
    setSubjects(list);
    setActiveId(prev => (prev && list.some(s => s.id === prev) ? prev : list[0]?.id || null));

    const map = await settings.get('currentStandardBySubject', {});
    setCurrentStdMap(map);

    const s = {};
    for (const sub of list) s[sub.id] = await subjectStats(sub.id);
    setStats(s);
    setTreeKey(k => k + 1);
  }

  useEffect(() => { reload(); }, []);

  const active = subjects.find(s => s.id === activeId) || null;

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
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
              className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium"
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
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
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
              key={`${active.id}-${treeKey}`}
              subject={active}
              currentStandardId={currentStdMap[active.id]}
              onSetCurrent={async (stdId) => {
                await settings.setCurrentStandard(active.id, stdId);
                setCurrentStdMap(prev => ({ ...prev, [active.id]: stdId }));
              }}
              onChanged={reload}
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
          onSaved={reload}
        />
      )}

      {bulkOpen && active && (
        <BulkImportModal
          subject={active}
          onClose={() => setBulkOpen(false)}
          onImported={() => {
            setBulkOpen(false);
            reload();
          }}
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
        className="mt-4 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm"
      >
        + Add Subject
      </button>
    </div>
  );
}
