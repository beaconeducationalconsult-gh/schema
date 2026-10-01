import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/schema';
import {
  loadSubjectTree,
  nextOrder,
  deleteStrand,
  deleteSubStrand,
  deleteStandard,
} from '../../db/curriculum';
import { confirmDialog } from '../../lib/dialogs';
import StandardEditor from './StandardEditor';
import InlineAdd from './InlineAdd';
import ResourceManagerModal from '../../components/ResourceManagerModal';
import ResourceGallery from '../../components/ResourceGallery';
import { Ellipsis } from 'lucide-react';

function matches(text, q) {
  if (!q) return true;
  return (text || '').toLowerCase().includes(q.toLowerCase());
}

function standardMatches(std, q) {
  if (!q) return true;
  const hay = [std.contentStandard, std.indicator, ...(std.exemplars || [])].join(' ').toLowerCase();
  return hay.includes(q.toLowerCase());
}

export default function SubjectTree({ subject, currentStandardId, onSetCurrent, searchQuery = '' }) {
  // Live tree: edits, deletes, media changes and bulk imports all show up by themselves.
  const tree = useLiveQuery(() => loadSubjectTree(subject.id), [subject.id]);
  // `undefined` = never toggled → default to the first strand / sub-strand; `null` = collapsed on purpose.
  const [strandPick, setOpenStrand] = useState(undefined);
  const [subPick, setOpenSub] = useState(undefined);
  const [editing, setEditing] = useState(null);
  const [mediaStandard, setMediaStandard] = useState(null);

  const q = (searchQuery || '').trim();
  const isSearching = q.length > 0;

  const filteredTree = useMemo(() => {
    if (!tree) return null;
    if (!isSearching) return tree;
    return tree
      .map((strand) => {
        const strandHit = matches(strand.name, q);
        const filteredSubs = strand.subStrands
          .map((sub) => {
            const subHit = matches(sub.name, q);
            const filteredStds = sub.standards.filter((std) => standardMatches(std, q) || strandHit || subHit);
            // If strand or sub hit, keep all standards under it; else only matching ones
            const keep = strandHit || subHit ? sub.standards : filteredStds;
            if (keep.length === 0 && !strandHit && !subHit) return null;
            return { ...sub, standards: keep };
          })
          .filter(Boolean);
        if (filteredSubs.length === 0) return null;
        return { ...strand, subStrands: filteredSubs };
      })
      .filter(Boolean);
  }, [tree, q, isSearching]);

  const displayTree = filteredTree;
  const openStrand = isSearching
    ? null // when searching we expand all via logic below
    : strandPick === undefined
      ? tree?.[0]?.id ?? null
      : strandPick;
  const openSub = isSearching
    ? null
    : subPick === undefined
      ? tree?.[0]?.subStrands?.[0]?.id ?? null
      : subPick;

  const addStrand = async (name) => {
    const id = await db.strands.add({
      subjectId: subject.id,
      name,
      order: await nextOrder('strands', 'subjectId', subject.id),
    });
    setOpenStrand(id);
  };

  const addSubStrand = async (strandId, name) => {
    const id = await db.subStrands.add({
      strandId,
      name,
      order: await nextOrder('subStrands', 'strandId', strandId),
    });
    setOpenSub(id);
  };

  const addStandard = async (subStrandId, payload) => {
    await db.standards.add({
      subStrandId,
      order: await nextOrder('standards', 'subStrandId', subStrandId),
      ...payload,
    });
  };

  if (!tree) return null;

  if (tree.length === 0) {
    return (
      <div className="bg-surface rounded-2xl border border-slate-200 p-6 text-center">
        <p className="text-sm text-slate-600 mb-3">No strands yet for {subject.name}.</p>
        <InlineAdd label="+ Add first strand" onAdd={addStrand} />
      </div>
    );
  }

  if (isSearching && (!displayTree || displayTree.length === 0)) {
    return (
      <div className="bg-surface rounded-2xl border border-slate-200 p-8 text-center">
        <div className="text-3xl mb-2">🔍</div>
        <p className="text-sm font-medium text-slate-700">No standards match “{q}”</p>
        <p className="text-xs text-slate-500 mt-1">Try a different keyword or clear the search.</p>
        <div className="text-xs text-slate-400 mt-3">
          {tree.reduce((s, st) => s + st.subStrands.reduce((a, sub) => a + sub.standards.length, 0), 0)} standards in {subject.name}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {isSearching && (
        <div className="text-xs text-slate-500 px-1">
          {displayTree.reduce((s, st) => s + st.subStrands.reduce((a, sub) => a + sub.standards.length, 0), 0)} result
          {displayTree.reduce((s, st) => s + st.subStrands.reduce((a, sub) => a + sub.standards.length, 0), 0) === 1 ? '' : 's'} for “{q}”
        </div>
      )}
      {displayTree.map((strand) => {
        const strandOpen = isSearching ? true : openStrand === strand.id;
        return (
          <div key={strand.id} className="bg-surface rounded-2xl border border-slate-200 shadow-sm">
            <button
              onClick={() => !isSearching && setOpenStrand(strandOpen ? null : strand.id)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left min-h-[56px]"
              aria-expanded={strandOpen}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-slate-400 w-4 text-center">{strandOpen ? '▾' : '▸'}</span>
                <div className="min-w-0">
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    Strand
                  </div>
                  <div className="font-semibold text-slate-800 truncate text-sm">{strand.name}</div>
                </div>
              </div>
              <span className="text-xs text-slate-400 shrink-0 ml-2">
                {strand.subStrands.length} sub-strand{strand.subStrands.length === 1 ? '' : 's'}
              </span>
            </button>

            {strandOpen && (
              <div className="border-t border-slate-100 px-4 py-3 space-y-2.5">
                {strand.subStrands.map((sub) => {
                  const subOpen = isSearching ? true : openSub === sub.id;
                  return (
                    <div key={sub.id} className="rounded-xl bg-slate-50 border border-slate-200/60">
                      <button
                        onClick={() => !isSearching && setOpenSub(subOpen ? null : sub.id)}
                        className="w-full flex items-center justify-between px-3 py-3 text-left min-h-[52px]"
                        aria-expanded={subOpen}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-slate-400 text-xs w-4 text-center">{subOpen ? '▾' : '▸'}</span>
                          <div className="min-w-0">
                            <div className="text-xs text-slate-400 uppercase font-semibold">
                              Sub-strand
                            </div>
                            <div className="text-sm font-medium text-slate-700 truncate">
                              {sub.name}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 shrink-0 ml-2">
                          {sub.standards.length} standard{sub.standards.length === 1 ? '' : 's'}
                        </span>
                      </button>

                      {subOpen && (
                        <div className="px-3 pb-3 space-y-2.5">
                          {sub.standards.map((std) => (
                            <StandardRow
                              key={std.id}
                              standard={std}
                              isCurrent={std.id === currentStandardId}
                              onSetCurrent={() => onSetCurrent(std.id)}
                              onEdit={() => setEditing({ standard: std, subStrandId: sub.id })}
                              onManageMedia={() => setMediaStandard(std)}
                              onDelete={async () => {
                                if (await confirmDialog({ title: 'Delete this standard?', confirmLabel: 'Delete', danger: true })) {
                                  await deleteStandard(std.id);
                                }
                              }}
                            />
                          ))}
                          <div className="flex justify-between items-center gap-2 pt-1 flex-wrap">
                            <InlineAdd
                              label="+ Standard"
                              onAdd={(val) =>
                                addStandard(sub.id, {
                                  contentStandard: val,
                                  indicator: '',
                                  exemplars: [],
                                })
                              }
                              placeholder="Content standard…"
                            />
                            <button
                              onClick={async () => {
                                if (
                                  await confirmDialog({
                                    title: 'Delete sub-strand?',
                                    message: 'All standards under it will be deleted too.',
                                    confirmLabel: 'Delete',
                                    danger: true,
                                  })
                                ) {
                                  await deleteSubStrand(sub.id);
                                }
                              }}
                              className="text-xs text-rose-600 px-3 py-2 rounded-lg border border-rose-200 hover:bg-rose-50 font-medium min-h-[36px]"
                            >
                              Delete sub-strand
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="pt-1 flex justify-between items-center flex-wrap gap-2">
                  <InlineAdd
                    label="+ Sub-strand"
                    onAdd={(v) => addSubStrand(strand.id, v)}
                    placeholder="Sub-strand name…"
                  />
                  <button
                    onClick={async () => {
                      if (
                        await confirmDialog({
                          title: 'Delete strand?',
                          message: 'All sub-strands and standards under it will be deleted too.',
                          confirmLabel: 'Delete',
                          danger: true,
                        })
                      ) {
                        await deleteStrand(strand.id);
                      }
                    }}
                    className="text-xs text-rose-600 px-3 py-2 rounded-lg border border-rose-200 hover:bg-rose-50 font-medium min-h-[36px]"
                  >
                    Delete strand
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className="pt-1">
        <InlineAdd label="+ Add strand" onAdd={addStrand} placeholder="Strand name…" />
      </div>

      {editing && (
        <StandardEditor standard={editing.standard} onClose={() => setEditing(null)} />
      )}

      {mediaStandard && (
        <ResourceManagerModal standard={mediaStandard} onClose={() => setMediaStandard(null)} />
      )}
    </div>
  );
}

function StandardRow({ standard, isCurrent, onSetCurrent, onEdit, onManageMedia, onDelete }) {
  const resCount = standard.resources?.length || 0;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className={`rounded-xl border p-3.5 transition ${
        isCurrent ? 'border-emerald-400 bg-emerald-50/70' : 'border-slate-200 bg-surface'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-xs text-slate-400 uppercase font-semibold tracking-wide">
            Content Standard
          </div>
          <div className="text-sm text-slate-800 leading-snug font-medium">
            {standard.contentStandard || <i className="text-slate-400">No content standard</i>}
          </div>
          {standard.indicator && (
            <div className="text-xs text-slate-600 mt-1.5">
              <b className="text-slate-700">Indicator:</b> {standard.indicator}
            </div>
          )}
          {standard.exemplars?.length > 0 && (
            <ul className="mt-1.5 text-xs text-slate-600 list-disc pl-4 space-y-0.5">
              {standard.exemplars.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}

          {resCount > 0 && (
            <div className="mt-3 pt-2 border-t border-slate-200/70">
              <ResourceGallery resources={standard.resources} compact />
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0 relative">
          {isCurrent ? (
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-600 text-white font-semibold">
              CURRENT
            </span>
          ) : (
            <button
              onClick={onSetCurrent}
              className="text-xs px-3 py-1.5 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-100 font-medium min-h-[32px]"
            >
              Set current
            </button>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={onManageMedia}
              className="text-xs px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 font-medium min-h-[32px]"
            >
              🖼️ Media ({resCount})
            </button>
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="true"
                aria-expanded={menuOpen}
                aria-label="Standard actions"
                className="w-8 h-8 rounded-full border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <Ellipsis size={14} />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden="true" />
                  <div className="absolute right-0 top-9 z-20 w-36 rounded-xl border border-slate-200 bg-surface shadow-lg p-1">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit();
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-sm hover:bg-slate-100 min-h-[44px]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete();
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-rose-600 hover:bg-rose-50 min-h-[44px]"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
