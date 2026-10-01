import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  const [search, setSearch] = useState('');

  useEffect(() => {
    const h = () => setEditingSubject({ isNew: true });
    window.addEventListener('tc-open-add-subject', h);
    return () => window.removeEventListener('tc-open-add-subject', h);
  }, []);

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
                className="px-3 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 min-h-[44px]"
              >
                ⬆ Bulk CSV
              </button>
            )}
            <button
              onClick={() => setEditingSubject({ isNew: true })}
              className="px-3 py-2.5 rounded-lg bg-primary text-on-primary text-xs font-medium min-h-[44px]"
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
              className={`px-3 py-2 rounded-full text-sm whitespace-nowrap border transition min-h-[36px] ${
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
                <span className="ml-2 text-xs opacity-70">
                  {stats[s.id].standards}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-4">
        {/* Library tabs — Standards | Notes (unified Library) */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-3 w-fit">
          <span className="px-4 py-1.5 rounded-lg bg-surface shadow text-slate-900 text-xs font-medium">Standards</span>
          <Link to="/notes" className="px-4 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 text-xs font-medium flex items-center gap-1.5">
            Notes
            <span className="hidden sm:inline text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">Hub</span>
          </Link>
          <Link to="/history" className="hidden sm:flex px-4 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 text-xs font-medium items-center">History</Link>
        </div>
        {active ? (
          <>
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="text-sm text-slate-500">
                {stats[active.id]?.strands || 0} strands ·{' '}
                {stats[active.id]?.subStrands || 0} sub-strands ·{' '}
                {stats[active.id]?.standards || 0} standards
              </div>
              <button
                onClick={() => setEditingSubject(active)}
                className="text-xs text-slate-600 hover:underline font-medium px-2 py-1.5 rounded-lg hover:bg-slate-100 min-h-[32px]"
              >
                Edit subject
              </button>
            </div>

            <div className="relative mb-3">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">
                🔍
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search standards, indicators, exemplars…"
                className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-300 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-slate-400"
                aria-label="Search curriculum"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <SubjectTree
              key={active.id}
              subject={active}
              currentStandardId={currentStdMap[active.id]}
              onSetCurrent={(stdId) => settings.setCurrentStandard(active.id, stdId)}
              searchQuery={search}
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
