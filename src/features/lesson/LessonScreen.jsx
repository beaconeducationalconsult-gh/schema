import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  lessonsFull,
  activityRepo,
  notes as noteRepo,
  standards as standardRepo,
} from '../../db/helpers';
import { db } from '../../db/schema';
import ActivityBlock from './ActivityBlock';
import ActivityPicker from './ActivityPicker';
import GuidedMode from './GuidedMode';
import PrintHeader from './PrintHeader';
import ResourceGallery from '../../components/ResourceGallery';
import ResourceManagerModal from '../../components/ResourceManagerModal';
import RoutineTemplateModal from '../../components/RoutineTemplateModal';
import CompleteLessonModal from '../../components/CompleteLessonModal';

const EMPTY = [];

export const ACTIVITY_META = {
  exercise:           { label: 'Exercise',       emoji: '✏️', color: 'bg-blue-600' },
  correction:         { label: 'Correction',     emoji: '✅', color: 'bg-emerald-600' },
  image_observation:  { label: 'Image',          emoji: '🖼️', color: 'bg-purple-600' },
  video:              { label: 'Video',          emoji: '🎬', color: 'bg-rose-600' },
  reading:            { label: 'Reading',        emoji: '📖', color: 'bg-amber-600' },
  discussion:         { label: 'Discussion',     emoji: '💬', color: 'bg-cyan-600' },
  assignment:         { label: 'Assignment',     emoji: '📝', color: 'bg-slate-700' },
};

export default function LessonScreen() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const guided = search.get('guided') === '1';

  const [pickerOpen, setPickerOpen] = useState(false);
  const [routineOpen, setRoutineOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [editingStandard, setEditingStandard] = useState(false);

  // Live: activities, notes, status and standard changes (from here, guided
  // mode, or another screen) re-render this page without manual reloads.
  // undefined = loading, null = no such lesson.
  const data = useLiveQuery(() => lessonsFull.hydrate(Number(id)), [id]);
  const loading = data === undefined;

  const allStandards = useLiveQuery(async () => {
    const list = await db.standards.toArray();
    const out = [];
    for (const s of list) {
      const ctx = await standardRepo.withContext(s.id);
      out.push({ ...s, _subject: ctx?.subject?.name, _strand: ctx?.strand?.name });
    }
    return out;
  }, [], EMPTY);

  if (loading) return <div className="p-6 text-slate-500">Loading lesson…</div>;
  if (!data || !data.lesson) return <NotFound />;

  if (guided) {
    return (
      <GuidedMode
        data={data}
        onExit={() => navigate(`/lesson/${id}`)}
      />
    );
  }

  const {
    lesson,
    slot,
    subject,
    strand,
    subStrand,
    standard,
    activities,
    notes,
    resources = [],
  } = data;

  return (
    <div className="min-h-screen bg-slate-50 pb-28 print:bg-white">
      <PrintHeader data={data} />

      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 print:hidden">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
          <Link to="/" className="text-sm text-slate-600 hover:text-slate-900 font-medium">
            ← Now
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              🖨️ Print
            </button>
            <button
              onClick={() => setRoutineOpen(true)}
              className="px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-blue-200 bg-blue-50 text-blue-700 font-medium hover:bg-blue-100"
            >
              ⚡ 1-Tap Routine
            </button>
            <button
              onClick={() => setPickerOpen(true)}
              className="px-3 py-1.5 text-xs sm:text-sm rounded-lg bg-slate-900 text-white font-medium"
            >
              + Activity
            </button>
            <button
              onClick={() => setCompleteOpen(true)}
              className="px-3 py-1.5 text-xs sm:text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              ✓ Complete Lesson
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-4 space-y-4">
        <LessonHeader
          lesson={lesson}
          slot={slot}
          subject={subject}
          date={lesson.date}
          onUpdate={async (patch) => {
            await lessonsFull.update(lesson.id, patch);
          }}
        />

        {standard ? (
          <StandardCard
            strand={strand}
            subStrand={subStrand}
            standard={standard}
            resources={resources}
            allStandards={allStandards}
            currentId={standard.id}
            onChange={async (newId) => {
              await lessonsFull.update(lesson.id, { standardId: newId });
            }}
            onEditStandard={() => setEditingStandard(true)}
            onManageMedia={() => setMediaOpen(true)}
          />
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800 flex items-center justify-between">
            <span>This lesson has no curriculum standard linked.</span>
            {allStandards.length > 0 && (
              <select
                value=""
                onChange={async (e) => {
                  if (!e.target.value) return;
                  await lessonsFull.update(lesson.id, { standardId: Number(e.target.value) });
                }}
                className="text-xs border border-amber-300 rounded-lg px-2 py-1 bg-white text-slate-800"
              >
                <option value="">Link a standard…</option>
                {allStandards.map(s => (
                  <option key={s.id} value={s.id}>
                    {s._subject} · {(s.contentStandard || '').slice(0, 40)}…
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Teaching plan ({activities.length})
            </h2>
            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={() => setRoutineOpen(true)}
                className="text-xs px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 font-medium"
              >
                ⚡ Load Routine Template
              </button>
              {activities.length > 0 && (
                <Link
                  to={`/lesson/${lesson.id}?guided=1`}
                  className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  ▶ Guided Mode
                </Link>
              )}
            </div>
          </div>

          {activities.length === 0 ? (
            <EmptyActivities
              onAdd={() => setPickerOpen(true)}
              onLoadRoutine={() => setRoutineOpen(true)}
            />
          ) : (
            <ActivityList
              activities={activities}
              onReorder={async (ids) => {
                await activityRepo.reorder(lesson.id, ids);
              }}
            />
          )}
        </section>

        <NotesPanel
          lessonId={lesson.id}
          standardId={standard?.id}
          notes={notes}
        />
      </main>

      {pickerOpen && (
        <ActivityPicker
          lessonId={lesson.id}
          onClose={() => setPickerOpen(false)}
          onAdded={() => {
            setPickerOpen(false);
          }}
        />
      )}

      {routineOpen && (
        <RoutineTemplateModal
          lessonId={lesson.id}
          standard={standard}
          hasExistingActivities={activities.length > 0}
          onClose={() => setRoutineOpen(false)}
        />
      )}

      {mediaOpen && standard && (
        <ResourceManagerModal
          standard={standard}
          onClose={() => setMediaOpen(false)}
        />
      )}

      {completeOpen && (
        <CompleteLessonModal
          data={data}
          onClose={() => setCompleteOpen(false)}
          onCompleted={() => {
            setCompleteOpen(false);
          }}
        />
      )}

      {editingStandard && standard && (
        <StandardQuickEdit
          standard={standard}
          onClose={() => setEditingStandard(false)}
          onSaved={() => {
            setEditingStandard(false);
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function LessonHeader({ lesson, slot, subject, date, onUpdate }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className="w-2 h-14 rounded-full shrink-0"
          style={{ backgroundColor: subject?.color || '#64748b' }}
        />
        <div className="flex-1 min-w-0">
          <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            {slot?.classLevel || 'Class'} · {formatDate(date)}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 truncate">
            {subject?.name || 'Lesson'}
          </h1>
          {slot && (
            <div className="text-sm text-slate-500 mt-0.5">
              {slot.startTime} – {slot.endTime}
              {slot.room ? ` · ${slot.room}` : ''}
            </div>
          )}
        </div>
        <select
          value={lesson.status || 'planned'}
          onChange={(e) => onUpdate({ status: e.target.value })}
          className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-medium print:hidden"
        >
          <option value="planned">Planned</option>
          <option value="in_progress">In progress</option>
          <option value="done">Done</option>
          <option value="postponed">Postponed</option>
        </select>
      </div>
    </div>
  );
}

function StandardCard({
  strand,
  subStrand,
  standard,
  resources,
  allStandards,
  currentId,
  onChange,
  onEditStandard,
  onManageMedia,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3 print:hidden">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          📚 Curriculum Standard
        </span>
        <div className="flex gap-2 items-center">
          <select
            value={currentId}
            onChange={(e) => onChange(Number(e.target.value))}
            className="text-xs border border-slate-300 rounded-lg px-2 py-1 max-w-[220px]"
          >
            {allStandards.map(s => (
              <option key={s.id} value={s.id}>
                {s._subject} · {(s.contentStandard || '').slice(0, 40)}…
              </option>
            ))}
          </select>
          <button onClick={onEditStandard} className="text-xs text-blue-600 font-medium">
            Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 bg-slate-50 rounded-xl p-3">
        <Meta label="Strand" value={strand?.name} />
        <Meta label="Sub-strand" value={subStrand?.name} />
      </div>

      <Meta label="Content Standard" value={standard.contentStandard} block />
      <div className="mt-2">
        <Meta label="Indicator" value={standard.indicator} block />
      </div>

      {standard.exemplars?.length > 0 && (
        <div className="mt-3 pt-2 border-t border-slate-100">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Exemplars
          </div>
          <ul className="text-sm text-slate-700 space-y-1">
            {standard.exemplars.map((e, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-slate-400">•</span>
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-slate-100">
        <ResourceGallery
          resources={resources}
          onManage={onManageMedia}
        />
      </div>
    </div>
  );
}

function Meta({ label, value, block }) {
  if (!value) return null;
  return (
    <div className={block ? '' : 'min-w-0'}>
      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</div>
      <div className="text-sm text-slate-800 leading-snug">{value}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ActivityList({ activities, onReorder }) {
  const [dragged, setDragged] = useState(null);

  const move = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= activities.length) return;
    const next = [...activities];
    const [item] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, item);
    onReorder(next.map(a => a.id));
  };

  return (
    <ol className="space-y-2">
      {activities.map((a, idx) => (
        <li
          key={a.id}
          draggable
          onDragStart={() => setDragged(idx)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            onReorder(swap(activities, dragged, idx).map(x => x.id));
            setDragged(null);
          }}
        >
          <ActivityBlock
            activity={a}
            index={idx}
            onMoveUp={() => move(idx, idx - 1)}
            onMoveDown={() => move(idx, idx + 1)}
          />
        </li>
      ))}
    </ol>
  );
}

function swap(arr, i, j) {
  if (i === j || i == null || j == null) return arr;
  const a = [...arr];
  const [x] = a.splice(i, 1);
  a.splice(j, 0, x);
  return a;
}

/* ------------------------------------------------------------------ */

function NotesPanel({ lessonId, standardId, notes }) {
  const [text, setText] = useState('');
  const [tag, setTag] = useState('prep');

  const save = async () => {
    if (!text.trim()) return;
    await noteRepo.add({
      lessonId,
      standardId: standardId || null,
      body: text.trim(),
      tags: tag ? [tag] : [],
    });
    setText('');
  };
  const remove = async (id) => {
    await noteRepo.remove(id);
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          📝 Lesson Notes
        </div>
        <Link to="/notes" className="text-xs text-blue-600 hover:underline print:hidden">
          All Notes Hub →
        </Link>
      </div>
      <div className="flex gap-1.5 mb-2 print:hidden flex-wrap">
        {['prep', 'remedial', 'insight', 'homework', 'absent'].map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTag(t)}
            className={`text-[10px] px-2 py-0.5 rounded-full border ${
              tag === t
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}
          >
            #{t}
          </button>
        ))}
      </div>
      <div className="flex gap-2 print:hidden">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          placeholder="Add a note…"
          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <button
          onClick={save}
          className="px-4 py-2 text-sm rounded-lg bg-slate-900 text-white"
        >
          Add
        </button>
      </div>
      {notes.length > 0 && (
        <ul className="mt-3 space-y-2">
          {notes.map(n => (
            <li
              key={n.id}
              className="text-sm text-slate-700 border-l-2 border-slate-200 pl-3 flex justify-between items-start gap-2"
            >
              <div>
                <span>{n.body}</span>
                {n.tags?.length > 0 && (
                  <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    #{n.tags[0]}
                  </span>
                )}
              </div>
              <button
                onClick={() => remove(n.id)}
                className="text-rose-400 hover:text-rose-600 text-xs print:hidden"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function EmptyActivities({ onAdd, onLoadRoutine }) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
      <div className="text-4xl mb-2">🎯</div>
      <p className="text-sm text-slate-600 mb-4">No teaching moves yet for this lesson.</p>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={onLoadRoutine}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
        >
          ⚡ Load 1-Tap Routine Template
        </button>
        <button
          onClick={onAdd}
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium"
        >
          + Add Custom Activity
        </button>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="text-5xl mb-3">🔍</div>
        <h2 className="text-lg font-semibold">Lesson not found</h2>
        <Link to="/" className="text-sm text-blue-600 mt-2 inline-block">
          ← Back to Now
        </Link>
      </div>
    </div>
  );
}

function StandardQuickEdit({ standard, onClose, onSaved }) {
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
        className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-5 shadow-xl"
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
            className="px-4 py-2 text-sm rounded-lg bg-slate-900 text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateKey) {
  if (!dateKey) return '';
  const d = new Date(dateKey + 'T00:00:00');
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
}
