import React, { useState } from 'react';
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

export default function SubjectTree({ subject, currentStandardId, onSetCurrent }) {
  // Live tree: edits, deletes, media changes and bulk imports all show up by themselves.
  const tree = useLiveQuery(() => loadSubjectTree(subject.id), [subject.id]);
  // `undefined` = never toggled → default to the first strand / sub-strand; `null` = collapsed on purpose.
  const [strandPick, setOpenStrand] = useState(undefined);
  const [subPick, setOpenSub] = useState(undefined);
  const [editing, setEditing] = useState(null);
  const [mediaStandard, setMediaStandard] = useState(null);

  const openStrand = strandPick === undefined ? tree?.[0]?.id ?? null : strandPick;
  const openSub = subPick === undefined ? tree?.[0]?.subStrands?.[0]?.id ?? null : subPick;

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

  return (
    <div className="space-y-3">
      {tree.map(strand => {
        const strandOpen = openStrand === strand.id;
        return (
          <div key={strand.id} className="bg-surface rounded-2xl border border-slate-200 shadow-sm">
            <button
              onClick={() => setOpenStrand(strandOpen ? null : strand.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-slate-400">{strandOpen ? '▾' : '▸'}</span>
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Strand
                  </div>
                  <div className="font-semibold text-slate-800 truncate">{strand.name}</div>
                </div>
              </div>
              <span className="text-xs text-slate-400">
                {strand.subStrands.length} sub-strand{strand.subStrands.length === 1 ? '' : 's'}
              </span>
            </button>

            {strandOpen && (
              <div className="border-t border-slate-100 px-4 py-3 space-y-2.5">
                {strand.subStrands.map(sub => {
                  const subOpen = openSub === sub.id;
                  return (
                    <div key={sub.id} className="rounded-xl bg-slate-50 border border-slate-200/60">
                      <button
                        onClick={() => setOpenSub(subOpen ? null : sub.id)}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-left"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-slate-400 text-xs">{subOpen ? '▾' : '▸'}</span>
                          <div className="min-w-0">
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">
                              Sub-strand
                            </div>
                            <div className="text-sm font-medium text-slate-700 truncate">
                              {sub.name}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {sub.standards.length} standard{sub.standards.length === 1 ? '' : 's'}
                        </span>
                      </button>

                      {subOpen && (
                        <div className="px-3 pb-3 space-y-2">
                          {sub.standards.map(std => (
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
                          <div className="flex justify-between items-center gap-2 pt-1">
                            <InlineAdd
                              label="+ Standard"
                              onAdd={(val) => addStandard(sub.id, {
                                contentStandard: val,
                                indicator: '',
                                exemplars: [],
                              })}
                              placeholder="Content standard…"
                            />
                            <button
                              onClick={async () => {
                                if (await confirmDialog({ title: 'Delete sub-strand?', message: 'All standards under it will be deleted too.', confirmLabel: 'Delete', danger: true })) {
                                  await deleteSubStrand(sub.id);
                                }
                              }}
                              className="text-xs text-rose-500 px-2 hover:underline"
                            >
                              Delete sub-strand
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="pt-1 flex justify-between items-center">
                  <InlineAdd
                    label="+ Sub-strand"
                    onAdd={(v) => addSubStrand(strand.id, v)}
                    placeholder="Sub-strand name…"
                  />
                  <button
                    onClick={async () => {
                      if (await confirmDialog({ title: 'Delete strand?', message: 'All sub-strands and standards under it will be deleted too.', confirmLabel: 'Delete', danger: true })) {
                        await deleteStrand(strand.id);
                      }
                    }}
                    className="text-xs text-rose-500 px-2 hover:underline"
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
        <StandardEditor
          standard={editing.standard}
          onClose={() => setEditing(null)}
        />
      )}

      {mediaStandard && (
        <ResourceManagerModal
          standard={mediaStandard}
          onClose={() => setMediaStandard(null)}
        />
      )}
    </div>
  );
}

function StandardRow({
  standard,
  isCurrent,
  onSetCurrent,
  onEdit,
  onManageMedia,
  onDelete,
}) {
  const resCount = standard.resources?.length || 0;

  return (
    <div
      className={`rounded-xl border p-3 transition ${
        isCurrent
          ? 'border-emerald-400 bg-emerald-50/70'
          : 'border-slate-200 bg-surface'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">
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
              {standard.exemplars.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}

          {resCount > 0 && (
            <div className="mt-3 pt-2 border-t border-slate-200/70">
              <ResourceGallery resources={standard.resources} compact />
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {isCurrent ? (
            <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-600 text-white font-semibold">
              CURRENT
            </span>
          ) : (
            <button
              onClick={onSetCurrent}
              className="text-[10px] px-2.5 py-1 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-100"
            >
              Set current
            </button>
          )}
          <button
            onClick={onManageMedia}
            className="text-[10px] px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 font-medium"
          >
            🖼️ Media ({resCount})
          </button>
          <div className="flex gap-2 mt-0.5">
            <button onClick={onEdit} className="text-[11px] text-blue-600 hover:underline">
              Edit
            </button>
            <button onClick={onDelete} className="text-[11px] text-rose-500 hover:underline">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
