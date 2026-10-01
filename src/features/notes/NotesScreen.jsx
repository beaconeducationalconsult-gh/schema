import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import {
  notes as noteRepo,
  subjects as subjectRepo,
  standards as standardRepo,
} from '../../db/helpers';
import { db } from '../../db/schema';
import { confirmDialog } from '../../lib/dialogs';

const EMPTY = [];

async function loadNotesData() {
  const [items, subjects, rawStds] = await Promise.all([
    noteRepo.allWithContext(),
    subjectRepo.all(),
    db.standards.toArray(),
  ]);
  const standardsList = [];
  for (const s of rawStds) {
    const ctx = await standardRepo.withContext(s.id);
    standardsList.push({
      ...s,
      _subjectName: ctx?.subject?.name || 'Subject',
      _subjectId: ctx?.subject?.id || null,
    });
  }
  return { items, subjects, standardsList };
}

const PRESET_TAGS = ['prep', 'remedial', 'insight', 'homework', 'absent', 'assessment'];

export default function NotesScreen() {
  // Live: notes added from a lesson, the Now screen or here all appear instantly.
  const data = useLiveQuery(loadNotesData, []);
  const loading = data === undefined;
  const items = data?.items ?? EMPTY;
  const subjects = data?.subjects ?? EMPTY;
  const standardsList = data?.standardsList ?? EMPTY;

  // Filters
  const [subjectFilter, setSubjectFilter] = useState(null);
  const [tagFilter, setTagFilter] = useState(null);
  const [search, setSearch] = useState('');

  // New note composer state
  const [body, setBody] = useState('');
  const [selectedTags, setSelectedTags] = useState(['prep']);
  const [selectedStandardId, setSelectedStandardId] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editBody, setEditBody] = useState('');
  const [editTags, setEditTags] = useState([]);

  const allTags = useMemo(() => {
    const set = new Set(PRESET_TAGS);
    for (const r of items) {
      for (const t of r.note.tags || []) set.add(t);
    }
    return Array.from(set);
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter(r => {
      if (subjectFilter && r.subject?.id !== subjectFilter) return false;
      if (tagFilter && !(r.note.tags || []).includes(tagFilter)) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const inBody = (r.note.body || '').toLowerCase().includes(q);
        const inInd  = (r.standard?.indicator || '').toLowerCase().includes(q);
        const inSub  = (r.subject?.name || '').toLowerCase().includes(q);
        const inTags = (r.note.tags || []).some(t => t.toLowerCase().includes(q));
        if (!inBody && !inInd && !inSub && !inTags) return false;
      }
      return true;
    });
  }, [items, subjectFilter, tagFilter, search]);

  const toggleComposerTag = (t) => {
    setSelectedTags(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    );
  };

  const addNote = async () => {
    if (!body.trim()) return;
    // Extract any inline #hashtags as well
    const inlineTags = (body.match(/#([a-zA-Z0-9_-]+)/g) || []).map(s =>
      s.slice(1).toLowerCase()
    );
    const mergedTags = Array.from(new Set([...selectedTags, ...inlineTags]));

    await noteRepo.add({
      lessonId: null,
      standardId: selectedStandardId ? Number(selectedStandardId) : null,
      body: body.trim(),
      tags: mergedTags,
    });
    setBody('');
  };

  const startEdit = (note) => {
    setEditingId(note.id);
    setEditBody(note.body || '');
    setEditTags(note.tags || []);
  };

  const saveEdit = async (id) => {
    if (!editBody.trim()) return;
    await noteRepo.update(id, {
      body: editBody.trim(),
      tags: editTags,
    });
    setEditingId(null);
  };

  const deleteNote = async (id) => {
    if (!(await confirmDialog({ title: 'Delete this note?', confirmLabel: 'Delete', danger: true }))) return;
    await noteRepo.remove(id);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="bg-surface border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Notes & Reflections Hub</h1>
            <p className="text-xs text-slate-500">
              All teaching notes, remedial reminders, and reflections across lessons & standards
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
            {filtered.length} {filtered.length === 1 ? 'note' : 'notes'}
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-4 space-y-4">
        {/* Library tabs — mirror Curriculum's Library */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          <Link to="/curriculum" className="px-4 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 text-xs font-medium">Standards</Link>
          <span className="px-4 py-1.5 rounded-lg bg-surface shadow text-slate-900 text-xs font-medium">Notes</span>
          <Link to="/history" className="hidden sm:flex px-4 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 text-xs font-medium items-center">History</Link>
        </div>
        {/* Composer Card */}
        <section className="bg-surface rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            ✍️ Jot a New Note or Reflection
          </div>
          <textarea
            rows={2}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a teaching observation, remedial reminder, or resource note… (tip: use #tags)"
            className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5">
            <div className="flex flex-wrap items-center gap-1">
              {PRESET_TAGS.map(t => {
                const active = selectedTags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleComposerTag(t)}
                    className={`text-[11px] px-2.5 py-0.5 rounded-full border transition ${
                      active
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    #{t}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <select
                value={selectedStandardId}
                onChange={(e) => setSelectedStandardId(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-surface max-w-[210px] truncate"
              >
                <option value="">Link to Standard (optional)…</option>
                {standardsList.map(s => (
                  <option key={s.id} value={s.id}>
                    {s._subjectName}: {(s.indicator || s.contentStandard).slice(0, 40)}…
                  </option>
                ))}
              </select>
              <button
                onClick={addNote}
                disabled={!body.trim()}
                className="px-4 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-medium disabled:opacity-40"
              >
                Save Note
              </button>
            </div>
          </div>
        </section>

        {/* Filters Card */}
        <section className="bg-surface rounded-2xl border border-slate-200 p-4 space-y-3 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <select
              value={subjectFilter ?? ''}
              onChange={(e) =>
                setSubjectFilter(e.target.value ? Number(e.target.value) : null)
              }
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-surface"
            >
              <option value="">All subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes, indicators, or #tags…"
              className="flex-1 min-w-[180px] text-xs border border-slate-300 rounded-lg px-3 py-1.5"
            />

            {(subjectFilter || tagFilter || search) && (
              <button
                onClick={() => {
                  setSubjectFilter(null);
                  setTagFilter(null);
                  setSearch('');
                }}
                className="text-xs text-slate-500 hover:text-slate-900 underline px-2"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Tag filter pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setTagFilter(null)}
              className={`text-[11px] px-2.5 py-1 rounded-full border ${
                !tagFilter
                  ? 'bg-primary text-on-primary border-primary font-medium'
                  : 'bg-surface text-slate-600 border-slate-200'
              }`}
            >
              All tags
            </button>
            {allTags.map(t => (
              <button
                key={t}
                onClick={() => setTagFilter(tagFilter === t ? null : t)}
                className={`text-[11px] px-2.5 py-1 rounded-full border ${
                  tagFilter === t
                    ? 'bg-blue-600 text-white border-blue-600 font-medium'
                    : 'bg-surface text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
        </section>

        {/* Notes Feed */}
        {loading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-24 bg-surface rounded-2xl" />
            <div className="h-24 bg-surface rounded-2xl" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-slate-200 p-10 text-center">
            <div className="text-4xl mb-2">📓</div>
            <h3 className="font-semibold text-slate-800">No notes found</h3>
            <p className="text-sm text-slate-500 mt-1">
              Jot a note above or clear your active filters.
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {filtered.map(({ note, lesson, standard, subject }) => {
              const isEditing = editingId === note.id;

              return (
                <li
                  key={note.id}
                  className="bg-surface rounded-2xl border border-slate-200 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {subject && (
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: subject.color || '#475569' }}
                        >
                          {subject.name}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        {formatTimestamp(note.createdAt)}
                      </span>
                      {lesson && (
                        <Link
                          to={`/lesson/${lesson.id}`}
                          className="text-xs text-blue-600 hover:underline font-medium"
                        >
                          Lesson ({lesson.date}) →
                        </Link>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => (isEditing ? setEditingId(null) : startEdit(note))}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {isEditing ? 'Cancel' : 'Edit'}
                      </button>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="text-xs text-rose-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2 mt-2">
                      <textarea
                        rows={3}
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                      />
                      <div className="flex flex-wrap gap-1">
                        {PRESET_TAGS.map(t => {
                          const has = editTags.includes(t);
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() =>
                                setEditTags(prev =>
                                  prev.includes(t)
                                    ? prev.filter(x => x !== t)
                                    : [...prev, t]
                                )
                              }
                              className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                has
                                  ? 'bg-primary text-on-primary border-primary'
                                  : 'bg-surface text-slate-500 border-slate-200'
                              }`}
                            >
                              #{t}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => saveEdit(note.id)}
                          className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-medium"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {note.body}
                      </p>

                      {standard && (
                        <div className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-100">
                          <b className="text-slate-600">Indicator:</b>{' '}
                          {standard.indicator || standard.contentStandard}
                        </div>
                      )}

                      {note.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {note.tags.map(t => (
                            <button
                              key={t}
                              onClick={() => setTagFilter(t)}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium"
                            >
                              #{t}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}

function formatTimestamp(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
