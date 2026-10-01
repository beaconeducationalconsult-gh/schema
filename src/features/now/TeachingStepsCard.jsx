import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { activityRepo } from '../../db/helpers';
import { ACTIVITY_TYPES } from '../../db/schema';
import { ACTIVITY_META } from '../../lib/activityMeta';
import { usePrefs, DEFAULT_PREFS } from '../../hooks/usePrefs';
import { toast } from '../../lib/dialogs';

export default function TeachingStepsCard({ items = [], lessonId, standard, onOpenTemplates, onToggleDone }) {
  const totalMin = items.reduce((s, a) => s + (a.duration || 0), 0);
  const doneCount = items.filter((a) => a.done).length;
  const sorted = [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const prefs = usePrefs();
  const defaultMin = prefs?.defaultActivityMinutes ?? DEFAULT_PREFS.defaultActivityMinutes;

  // Add sheet
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(ACTIVITY_TYPES[0]);
  const [title, setTitle] = useState('');
  const [draft, setDraft] = useState('');
  const [duration, setDuration] = useState(null);

  const openSheet = () => {
    const meta = ACTIVITY_META[ACTIVITY_TYPES[0]];
    setSelectedType(ACTIVITY_TYPES[0]);
    setTitle(meta.defaultTitle);
    setDraft(standard?.exemplars?.[0] || '');
    setDuration(null);
    setSheetOpen(true);
  };

  useEffect(() => {
    const h = () => {
      const meta = ACTIVITY_META[ACTIVITY_TYPES[0]];
      setSelectedType(ACTIVITY_TYPES[0]);
      setTitle(meta.defaultTitle);
      setDraft(standard?.exemplars?.[0] || '');
      setDuration(null);
      setSheetOpen(true);
    };
    window.addEventListener('tc-open-add-step', h);
    return () => window.removeEventListener('tc-open-add-step', h);
  }, [standard]);

  const selectType = (t) => {
    setSelectedType(t);
    setTitle(ACTIVITY_META[t].defaultTitle);
  };

  const save = async () => {
    if (!lessonId) return toast.error('No lesson yet for this slot.');
    const meta = ACTIVITY_META[selectedType];
    await activityRepo.add({
      lessonId,
      type: selectedType,
      title: title.trim() || meta.defaultTitle,
      content: draft.trim(),
      duration: Number(duration ?? defaultMin) || defaultMin,
      done: false,
    });
    setSheetOpen(false);
  };

  // Inline edit
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editDuration, setEditDuration] = useState('');

  const startEdit = (a) => {
    setEditingId(a.id);
    setEditTitle(a.title || '');
    setEditContent(a.content || '');
    setEditDuration(String(a.duration || ''));
  };

  const saveEdit = async (a) => {
    await activityRepo.update(a.id, {
      title: editTitle.trim() || a.title,
      content: editContent.trim(),
      duration: Number(editDuration) || a.duration,
    });
    setEditingId(null);
  };

  const move = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= sorted.length) return;
    const next = [...sorted];
    const [item] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, item);
    activityRepo.reorder(lessonId, next.map((x) => x.id));
  };

  const remove = async (a) => {
    const snapshot = { ...a };
    await activityRepo.remove(a.id);
    toast(`Removed "${a.title}"`, {
      action: {
        label: 'Undo',
        onClick: async () => {
          await activityRepo.add({
            lessonId: snapshot.lessonId,
            type: snapshot.type,
            title: snapshot.title,
            content: snapshot.content,
            duration: snapshot.duration,
            done: snapshot.done,
          });
        },
      },
    });
  };

  return (
    <section id="teaching-steps" className="max-w-3xl mx-auto px-4 pt-3">
      <div className="bg-surface rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Teaching steps {items.length > 0 ? `(${doneCount}/${items.length} · ${totalMin} min)` : ''}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenTemplates}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold min-h-[32px]"
            >
              ⚡ Use routine
            </button>
            {lessonId && items.length > 0 && (
              <Link to={`/lesson/${lessonId}`} className="text-xs text-blue-600 font-medium hover:underline px-2 py-1">
                Edit plan →
              </Link>
            )}
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-3xl mb-2">🎯</div>
            <p className="text-sm text-slate-600 mb-3">No teaching steps yet. Add your first move.</p>
            <button
              onClick={openSheet}
              className="px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-medium min-h-[44px]"
            >
              + Add first step
            </button>
          </div>
        ) : (
          <ol className="space-y-2.5">
            {sorted.map((a, idx) => {
              const m = ACTIVITY_META[a.type];
              const isEditing = editingId === a.id;
              return (
                <li
                  key={a.id}
                  draggable={!isEditing}
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', String(idx))}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const from = Number(e.dataTransfer.getData('text/plain'));
                    if (!Number.isNaN(from)) move(from, idx);
                  }}
                  className={`flex gap-3 items-start p-3 rounded-xl border transition group ${
                    a.done ? 'bg-emerald-50/50 border-emerald-200 opacity-75' : 'bg-slate-50/70 border-slate-200/80'
                  }`}
                >
                  <button
                    onClick={() => onToggleDone?.(a)}
                    title={a.done ? 'Mark undone' : 'Mark done'}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs border shrink-0 mt-0.5 ${
                      a.done ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-surface border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    ✓
                  </button>
                  <span className="text-lg leading-none mt-1">{m?.emoji}</span>
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                          placeholder="Title"
                        />
                        <textarea
                          rows={2}
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                          placeholder="Instructions"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editDuration}
                            onChange={(e) => setEditDuration(e.target.value)}
                            className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm"
                            placeholder="min"
                          />
                          <span className="text-xs text-slate-500">min</span>
                          <div className="ml-auto flex gap-1">
                            <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs rounded-lg hover:bg-slate-100">
                              Cancel
                            </button>
                            <button onClick={() => saveEdit(a)} className="px-3 py-1.5 text-xs rounded-lg bg-primary text-on-primary">
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm font-medium text-slate-800 flex items-center gap-2 min-w-0">
                            <span className={a.done ? 'line-through text-slate-500 truncate' : 'truncate'}>
                              {idx + 1}. {a.title}
                            </span>
                            {a.duration ? <span className="text-xs text-slate-400 font-normal shrink-0">{a.duration} min</span> : null}
                          </div>
                          <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                            <button
                              onClick={() => move(idx, idx - 1)}
                              disabled={idx === 0}
                              className="w-6 h-6 rounded-full hover:bg-slate-200 flex items-center justify-center text-xs disabled:opacity-30"
                              title="Move up"
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => move(idx, idx + 1)}
                              disabled={idx === sorted.length - 1}
                              className="w-6 h-6 rounded-full hover:bg-slate-200 flex items-center justify-center text-xs disabled:opacity-30"
                              title="Move down"
                            >
                              ↓
                            </button>
                          </div>
                        </div>
                        {a.content && <div className="text-xs text-slate-600 mt-1 line-clamp-2">{a.content}</div>}
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => startEdit(a)} className="text-xs text-blue-600 hover:underline">
                            Edit
                          </button>
                          <span className="text-xs text-slate-300">·</span>
                          <button onClick={() => remove(a)} className="text-xs text-rose-600 hover:underline">
                            Delete
                          </button>
                          <span className="hidden sm:inline text-xs text-slate-300 ml-1">· drag to reorder</span>
                        </div>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {sorted.length > 0 && (
          <button
            onClick={openSheet}
            className="w-full mt-3 py-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 text-slate-700 font-medium text-sm flex items-center justify-center gap-2 min-h-[48px]"
          >
            + Add step
          </button>
        )}
      </div>

      {sheetOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setSheetOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-surface w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Add teaching step</h3>
              <button onClick={() => setSheetOpen(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500" aria-label="Close">
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3">Attached to today's lesson ({standard?.indicator?.slice(0, 50) || 'current slot'}).</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {ACTIVITY_TYPES.map((type) => {
                const mm = ACTIVITY_META[type];
                const active = selectedType === type;
                return (
                  <button
                    key={type}
                    onClick={() => selectType(type)}
                    className={`px-2.5 py-2 rounded-full text-xs font-medium border flex items-center gap-1.5 min-h-[36px] ${active ? 'bg-primary text-on-primary border-primary shadow-sm' : 'bg-surface text-slate-700 border-slate-200 hover:border-slate-300'}`}
                  >
                    <span>{mm.emoji}</span>
                    <span>{mm.label}</span>
                  </button>
                );
              })}
            </div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Activity Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-slate-400 min-h-[44px]" placeholder={ACTIVITY_META[selectedType].defaultTitle} />
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Prompt / Instructions</label>
            <textarea autoFocus rows={4} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={ACTIVITY_META[selectedType].placeholder} className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
            <div className="flex items-center gap-3 mt-3">
              <label className="text-sm text-slate-600">Duration (min)</label>
              <input type="number" min={1} max={120} value={duration ?? defaultMin} onChange={(e) => setDuration(e.target.value === '' ? '' : Number(e.target.value))} className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[44px]" aria-label="Duration" />
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setSheetOpen(false)} className="px-4 py-2.5 text-sm rounded-xl text-slate-600 hover:bg-slate-100 min-h-[44px]">Cancel</button>
              <button onClick={save} className="px-5 py-2.5 text-sm rounded-xl bg-primary text-on-primary font-medium min-h-[44px]">Save Activity</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
