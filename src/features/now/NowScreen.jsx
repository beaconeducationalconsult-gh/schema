import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { useNow } from '../../hooks/useNow';
import {
  subjects as subjectRepo,
  standards as standardRepo,
  activities as activityRepo,
  notes as noteRepo,
  resources as resourceRepo,
  settings as settingsRepo,
  toDateKey,
} from '../../db/helpers';
import { ensureNowLesson, loadNowContext } from '../../db/now';
import { daysSinceExport } from '../../db/backup';
import { ACTIVITY_TYPES, db } from '../../db/schema';
import { toast } from '../../lib/dialogs';
import ResourceGallery from '../../components/ResourceGallery';
import ResourceManagerModal from '../../components/ResourceManagerModal';
import RoutineTemplateModal from '../../components/RoutineTemplateModal';
import CompleteLessonModal from '../../components/CompleteLessonModal';

const EMPTY_LIST = [];
const EMPTY_MAP = {};
const DAY_NAMES = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const ACTIVITY_META = {
  exercise: {
    label: 'Exercise',
    emoji: '✏️',
    color: 'bg-blue-600 hover:bg-blue-700',
    ring: 'ring-blue-500',
    placeholder: 'Type the exercise prompt for the class…',
    defaultTitle: 'Class Exercise',
  },
  correction: {
    label: 'Correction',
    emoji: '✅',
    color: 'bg-emerald-600 hover:bg-emerald-700',
    ring: 'ring-emerald-500',
    placeholder: 'What are you correcting and what to focus on…',
    defaultTitle: 'Correction',
  },
  image_observation: {
    label: 'Image',
    emoji: '🖼️',
    color: 'bg-purple-600 hover:bg-purple-700',
    ring: 'ring-purple-500',
    placeholder: 'Describe the image and what learners should observe…',
    defaultTitle: 'Image Observation',
  },
  video: {
    label: 'Video',
    emoji: '🎬',
    color: 'bg-rose-600 hover:bg-rose-700',
    ring: 'ring-rose-500',
    placeholder: 'Video title/link and what to note while watching…',
    defaultTitle: 'Video Watching',
  },
  reading: {
    label: 'Reading',
    emoji: '📖',
    color: 'bg-amber-600 hover:bg-amber-700',
    ring: 'ring-amber-500',
    placeholder: 'Passage/page and what to identify while reading…',
    defaultTitle: 'Reading',
  },
  discussion: {
    label: 'Discussion',
    emoji: '💬',
    color: 'bg-cyan-600 hover:bg-cyan-700',
    ring: 'ring-cyan-500',
    placeholder: 'Group discussion question…',
    defaultTitle: 'Group Discussion',
  },
  assignment: {
    label: 'Assignment',
    emoji: '📝',
    color: 'bg-slate-700 hover:bg-slate-800',
    ring: 'ring-slate-500',
    placeholder: 'Home assignment details…',
    defaultTitle: 'Home Assignment',
  },
};

export default function NowScreen() {
  const {
    now,
    slots,
    allSlots,
    current,
    next,
    isInClass,
    minutesToNext,
    minutesLeftInClass,
  } = useNow();

  const [overrideSlotId, setOverrideSlotId] = useState(null);

  // Modals
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [routineModalOpen, setRoutineModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);

  // Live reads: anything changed here, on the Lesson screen, in Curriculum or
  // by a backup restore is reflected without manual refreshes.
  const subjectsMap = useLiveQuery(
    async () => Object.fromEntries((await subjectRepo.all()).map(s => [s.id, s])),
    [],
    EMPTY_MAP
  );
  const backupAgeDays = useLiveQuery(daysSinceExport, [], null);

  const liveSlot = current || next;
  const fallbackSlot = slots[0] || allSlots[0] || null;
  const activeSlot = overrideSlotId
    ? allSlots.find(s => s.id === Number(overrideSlotId)) || liveSlot || fallbackSlot
    : liveSlot || fallbackSlot;
  const isPreviewMode = !!overrideSlotId || (!liveSlot && !!fallbackSlot);

  // Creating today's lesson row is a write, so it lives in an effect — keyed by
  // slot + date, and only ever sets state after the async work finishes.
  const slotId = activeSlot?.id ?? null;
  const dateKey = toDateKey(now);
  const lessonKey = slotId == null ? null : `${slotId}:${dateKey}`;
  const [ensured, setEnsured] = useState({ key: null, lessonId: null });
  useEffect(() => {
    if (!lessonKey) return undefined;
    let alive = true;
    ensureNowLesson(activeSlot, now).then(lesson => {
      if (alive) setEnsured({ key: lessonKey, lessonId: lesson?.id ?? null });
    });
    return () => { alive = false; };
    // `activeSlot`/`now` are captured for their values at the moment the key changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonKey]);
  const lessonId = ensured.key === lessonKey ? ensured.lessonId : null;

  const context = useLiveQuery(
    () => (lessonId != null ? loadNowContext(slotId, lessonId) : null),
    [slotId, lessonId]
  );
  const loadingContext = !context;
  const subjectStandards = context?.subjectStandards ?? EMPTY_LIST;
  const stdResources = context?.resources ?? EMPTY_LIST;
  const recentNotes = context?.recentNotes ?? EMPTY_LIST;
  const activityFeed = context?.activities ?? EMPTY_LIST;

  const handleSwitchStandard = async (newStdId) => {
    if (!context?.subject) return;
    const stdId = Number(newStdId);
    await settingsRepo.setCurrentStandard(context.subject.id, stdId);
    if (context.lesson) {
      await db.lessons.update(context.lesson.id, { standardId: stdId });
    }
    // The live query above picks the change up on its own.
  };

  if (!activeSlot && allSlots.length === 0) {
    return <EmptyDay />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-36">
      <StatusBanner
        isInClass={isInClass && !overrideSlotId}
        isPreviewMode={isPreviewMode}
        current={current}
        next={next}
        activeSlot={activeSlot}
        minutesToNext={minutesToNext}
        minutesLeftInClass={minutesLeftInClass}
        slots={slots.length > 0 ? slots : allSlots}
        subjectsMap={subjectsMap}
        overrideSlotId={overrideSlotId}
        onSelectSlot={(id) => setOverrideSlotId(id)}
      />

      {backupAgeDays != null && backupAgeDays > 14 && (
        <div className="max-w-3xl mx-auto px-4 pt-3">
          <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center justify-between">
            <span>It's been {backupAgeDays} days since your last backup.</span>
            <Link to="/settings" className="underline font-medium">Export now</Link>
          </div>
        </div>
      )}

      {loadingContext || !context ? (
        <ContextSkeleton />
      ) : (
        <>
          <ClassCard
            slot={context.slot}
            subject={context.subject}
            lesson={context.lesson}
            isPreviewMode={isPreviewMode}
            onCompleteLesson={() => setCompleteModalOpen(true)}
          />

          {context.standard ? (
            <CurriculumCard
              strand={context.strand}
              subStrand={context.subStrand}
              standard={context.standard}
              allStandards={subjectStandards}
              resources={stdResources}
              onSwitchStandard={handleSwitchStandard}
              onManageMedia={() => setMediaModalOpen(true)}
            />
          ) : (
            <NoStandardCard subject={context.subject} />
          )}

          <ActivityPromptBar
            lessonId={context.lesson?.id}
            standard={context.standard}
            onOpenTemplates={() => setRoutineModalOpen(true)}
          />

          {activityFeed.length > 0 && (
            <ActivityFeed
              items={activityFeed}
              lessonId={context.lesson?.id}
              onToggleDone={async (act) => {
                const nextDone = !act.done;
                await activityRepo.update(act.id, { done: nextDone });
              }}
              onCompleteLesson={() => setCompleteModalOpen(true)}
            />
          )}

          <NotesStrip
            lesson={context.lesson}
            notes={recentNotes}
          />

          {context.lesson && (
            <LessonActions
              lesson={context.lesson}
              onCompleteLesson={() => setCompleteModalOpen(true)}
            />
          )}
        </>
      )}

      {mediaModalOpen && context?.standard && (
        <ResourceManagerModal
          standard={context.standard}
          onClose={() => setMediaModalOpen(false)}
        />
      )}

      {routineModalOpen && context?.lesson && (
        <RoutineTemplateModal
          lessonId={context.lesson.id}
          standard={context.standard}
          hasExistingActivities={activityFeed.length > 0}
          onClose={() => setRoutineModalOpen(false)}
        />
      )}

      {completeModalOpen && context && (
        <CompleteLessonModal
          data={{
            lesson: context.lesson,
            subject: context.subject,
            standard: context.standard,
            activities: activityFeed,
          }}
          onClose={() => setCompleteModalOpen(false)}
          onCompleted={async ({ choice, nextStd }) => {
            setCompleteModalOpen(false);
            if (choice === 'advance' && nextStd?.standard && context.lesson) {
              await db.lessons.update(context.lesson.id, {
                standardId: nextStd.standard.id,
              });
            }
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Status banner                                                      */
/* ------------------------------------------------------------------ */
function StatusBanner({
  isInClass,
  isPreviewMode,
  current,
  next,
  activeSlot,
  minutesToNext,
  minutesLeftInClass,
  slots,
  subjectsMap,
  overrideSlotId,
  onSelectSlot,
}) {
  const tone = isInClass
    ? 'from-emerald-600 to-emerald-500'
    : !isPreviewMode && minutesToNext != null && minutesToNext <= 15
      ? 'from-amber-500 to-amber-400'
      : 'from-slate-800 to-slate-700';

  const title = isInClass
    ? `IN CLASS · ${minutesLeftInClass} min left`
    : !isPreviewMode && next
      ? `NEXT CLASS IN ${minutesToNext} MIN`
      : activeSlot
        ? `PREVIEWING · ${DAY_NAMES[activeSlot.dayOfWeek] || ''} ${activeSlot.startTime}`
        : 'No more classes today';

  const subtitle = isInClass
    ? `${current.startTime} – ${current.endTime} · ${current.room || ''}`
    : !isPreviewMode && next
      ? `${next.startTime} – ${next.endTime} · ${next.room || ''}`
      : activeSlot
        ? `${activeSlot.startTime} – ${activeSlot.endTime} · ${activeSlot.room || ''}`
        : '';

  return (
    <div className={`sticky top-0 z-20 bg-gradient-to-r ${tone} text-white shadow-md`}>
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-xs uppercase tracking-wider opacity-80">
              {new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
              })}
            </div>
            <div className="text-lg font-bold tracking-tight">{title}</div>
            {subtitle && <div className="text-xs opacity-90">{subtitle}</div>}
          </div>

          <div className="flex items-center gap-2">
            {slots.length > 0 && (
              <select
                aria-label="Switch timetable slot"
                value={overrideSlotId || ''}
                onChange={(e) => onSelectSlot(e.target.value ? Number(e.target.value) : null)}
                className="text-xs bg-white/15 hover:bg-white/25 text-white border border-white/25 rounded-lg px-2.5 py-1.5 backdrop-blur focus:outline-none"
              >
                <option value="" className="text-slate-900">
                  ⏱️ Live Clock
                </option>
                {slots.map(s => {
                  const sub = subjectsMap[s.subjectId];
                  return (
                    <option key={s.id} value={s.id} className="text-slate-900">
                      {DAY_NAMES[s.dayOfWeek]} {s.startTime} · {sub?.name || 'Class'}
                    </option>
                  );
                })}
              </select>
            )}
            <div className="text-2xl hidden sm:block">
              {isInClass ? '🎓' : next ? '⏱️' : '📋'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Class card — Where am I?                                           */
/* ------------------------------------------------------------------ */
function ClassCard({ slot, subject, lesson, isPreviewMode, onCompleteLesson }) {
  return (
    <section className="max-w-3xl mx-auto px-4 pt-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center gap-3">
          <span
            className="w-3 h-14 rounded-full shrink-0"
            style={{ backgroundColor: subject?.color || '#475569' }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {slot.classLevel}
              </span>
              {isPreviewMode && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                  {DAY_NAMES[slot.dayOfWeek]} Slot
                </span>
              )}
              {lesson?.status === 'done' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold uppercase">
                  Completed
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 truncate">
              {subject?.name || 'Unknown subject'}
            </h1>
            <div className="text-sm text-slate-600 mt-0.5">
              {slot.startTime} – {slot.endTime}
              {slot.room && <> · <span className="font-medium">{slot.room}</span></>}
            </div>
          </div>

          {lesson && (
            <div className="hidden sm:flex flex-col gap-1.5 shrink-0">
              <Link
                to={`/lesson/${lesson.id}`}
                className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-medium text-center hover:bg-slate-800"
              >
                Open Lesson Plan
              </Link>
              <div className="flex gap-1.5">
                <Link
                  to={`/lesson/${lesson.id}?guided=1`}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-medium text-center hover:bg-blue-700"
                >
                  ▶ Guided
                </Link>
                <button
                  onClick={onCompleteLesson}
                  title="Mark taught & advance standard"
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
                >
                  ✓ Wrap Up
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Curriculum card — What am I teaching? + Visual Resources           */
/* ------------------------------------------------------------------ */
function CurriculumCard({
  strand,
  subStrand,
  standard,
  allStandards,
  resources,
  onSwitchStandard,
  onManageMedia,
}) {
  return (
    <section className="max-w-3xl mx-auto px-4 pt-3">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <span>📚 What I'm Teaching</span>
          </div>

          {allStandards?.length > 1 && (
            <select
              aria-label="Switch curriculum standard"
              value={standard.id}
              onChange={(e) => onSwitchStandard(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 text-slate-700 bg-slate-50 max-w-[220px] truncate"
            >
              {allStandards.map(s => (
                <option key={s.id} value={s.id}>
                  {s._subStrandName}: {(s.indicator || s.contentStandard).slice(0, 45)}…
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
          <Meta label="Strand" value={strand?.name} />
          <Meta label="Sub-strand" value={subStrand?.name} />
        </div>

        <div className="mb-3">
          <Meta label="Content Standard" value={standard.contentStandard} block />
        </div>
        <div className="mb-3">
          <Meta label="Indicator" value={standard.indicator} block highlight />
        </div>

        {standard.exemplars?.length > 0 && (
          <div className="pt-2 border-t border-slate-100 mb-3">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Exemplars
            </div>
            <ul className="space-y-1.5">
              {standard.exemplars.map((e, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-700">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-3 border-t border-slate-100">
          <ResourceGallery
            resources={resources}
            onManage={onManageMedia}
            compact
          />
        </div>
      </div>
    </section>
  );
}

function Meta({ label, value, block, highlight }) {
  if (!value) return null;
  return (
    <div className={block ? '' : 'min-w-0'}>
      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
        {label}
      </div>
      <div
        className={`text-sm leading-snug mt-0.5 ${
          highlight ? 'text-slate-900 font-medium' : 'text-slate-800'
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function NoStandardCard({ subject }) {
  return (
    <section className="max-w-3xl mx-auto px-4 pt-3">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800 flex items-center justify-between">
        <div>
          No curriculum standard linked to <b>{subject?.name}</b> yet.
        </div>
        <Link
          to="/curriculum"
          className="px-3 py-1.5 rounded-lg bg-amber-800 text-white text-xs font-medium shrink-0"
        >
          Open Curriculum
        </Link>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Activity prompt bar + 1-Tap Routine Templates                      */
/* ------------------------------------------------------------------ */
function ActivityPromptBar({ lessonId, standard, onOpenTemplates }) {
  const [openType, setOpenType] = useState(null);
  const [title, setTitle] = useState('');
  const [draft, setDraft] = useState('');
  const [duration, setDuration] = useState(10);

  const open = (type) => {
    const meta = ACTIVITY_META[type];
    setOpenType(type);
    setTitle(meta.defaultTitle);
    const exemplarHint = standard?.exemplars?.[0]
      ? `${standard.exemplars[0]}`
      : '';
    setDraft(exemplarHint);
    setDuration(10);
  };

  const save = async () => {
    if (!lessonId) return toast.error('No lesson yet for this slot.');
    const meta = ACTIVITY_META[openType];
    const payload = {
      lessonId,
      type: openType,
      title: title.trim() || meta.defaultTitle,
      content: draft.trim(),
      duration: Number(duration) || 10,
      done: false,
    };
    await activityRepo.add(payload);
    setOpenType(null);
  };

  return (
    <section className="max-w-3xl mx-auto px-4 pt-3">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            🎯 How I'm Teaching — Quick Prompt Bar
          </div>
          <button
            onClick={onOpenTemplates}
            className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold transition"
          >
            ⚡ 1-Tap Routine
          </button>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {ACTIVITY_TYPES.map((type) => {
            const m = ACTIVITY_META[type];
            return (
              <button
                key={type}
                onClick={() => open(type)}
                className={`${m.color} text-white rounded-xl py-3 px-2 text-xs font-medium flex flex-col items-center gap-1 transition active:scale-95 shadow-sm`}
              >
                <span className="text-xl">{m.emoji}</span>
                <span className="truncate max-w-full">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {openType && (
        <Modal onClose={() => setOpenType(null)}>
          <h3 className="text-lg font-semibold mb-1">
            {ACTIVITY_META[openType].emoji} {ACTIVITY_META[openType].label}
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Attached to today's lesson ({standard?.indicator?.slice(0, 50) || 'current slot'}).
          </p>

          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
            Activity Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-slate-400"
            placeholder={ACTIVITY_META[openType].defaultTitle}
          />

          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
            Prompt / Instructions
          </label>
          <textarea
            autoFocus
            rows={4}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={ACTIVITY_META[openType].placeholder}
            className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />

          <div className="flex items-center gap-3 mt-3">
            <label className="text-xs text-slate-600">Duration (min)</label>
            <input
              type="number"
              min={1}
              max={120}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setOpenType(null)}
              className="px-4 py-2 text-sm rounded-lg text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={!draft.trim() && !title.trim()}
              className="px-4 py-2 text-sm rounded-lg bg-slate-900 text-white disabled:opacity-40"
            >
              Save Activity
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Activity feed                                                      */
/* ------------------------------------------------------------------ */
function ActivityFeed({ items, lessonId, onToggleDone, onCompleteLesson }) {
  const totalMin = items.reduce((s, a) => s + (a.duration || 0), 0);
  const doneCount = items.filter(a => a.done).length;

  return (
    <section className="max-w-3xl mx-auto px-4 pt-3">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            📋 Lesson Activities ({doneCount}/{items.length} done · {totalMin} min)
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onCompleteLesson}
              className="text-xs text-emerald-700 font-semibold hover:underline"
            >
              ✓ Complete & Advance
            </button>
            {lessonId && (
              <Link
                to={`/lesson/${lessonId}`}
                className="text-xs text-blue-600 font-medium hover:underline"
              >
                Edit Plan →
              </Link>
            )}
          </div>
        </div>
        <ol className="space-y-2.5">
          {items
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((a, idx) => {
              const m = ACTIVITY_META[a.type];
              return (
                <li
                  key={a.id}
                  className={`flex gap-3 items-start p-2.5 rounded-xl border transition ${
                    a.done
                      ? 'bg-emerald-50/50 border-emerald-200 opacity-75'
                      : 'bg-slate-50/70 border-slate-200/80'
                  }`}
                >
                  <button
                    onClick={() => onToggleDone?.(a)}
                    title={a.done ? 'Mark undone' : 'Mark done'}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs mt-0.5 border shrink-0 ${
                      a.done
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white border-slate-300 text-transparent hover:border-slate-500'
                    }`}
                  >
                    ✓
                  </button>
                  <span className="text-lg leading-none mt-0.5">{m?.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 flex items-center gap-2">
                      <span className={a.done ? 'line-through text-slate-500' : ''}>
                        {idx + 1}. {a.title}
                      </span>
                      {a.duration ? (
                        <span className="text-[11px] text-slate-400 font-normal">
                          {a.duration} min
                        </span>
                      ) : null}
                    </div>
                    {a.content && (
                      <div className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                        {a.content}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Notes strip                                                        */
/* ------------------------------------------------------------------ */
function NotesStrip({ lesson, notes }) {
  const [text, setText] = useState('');
  const [tag, setTag] = useState('prep');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!lesson || !text.trim()) return;
    setSaving(true);
    const payload = {
      lessonId: lesson.id,
      standardId: lesson.standardId,
      body: text.trim(),
      tags: tag ? [tag] : [],
    };
    await noteRepo.add(payload);
    setText('');
    setSaving(false);
  };

  return (
    <section className="max-w-3xl mx-auto px-4 pt-3">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            📝 Quick Lesson Notes
          </div>
          <Link to="/notes" className="text-xs text-blue-600 font-medium hover:underline">
            All Notes Hub →
          </Link>
        </div>

        <div className="flex gap-1.5 mb-2 flex-wrap">
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

        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            placeholder="Jot a reflection or reminder about this class…"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          <button
            onClick={save}
            disabled={!text.trim() || saving}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium disabled:opacity-40"
          >
            Add
          </button>
        </div>

        {notes.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {notes.map((n) => (
              <li
                key={n.id}
                className="text-xs text-slate-700 border-l-2 border-blue-400 pl-2.5 py-0.5 flex items-center justify-between gap-2"
              >
                <span>{n.body}</span>
                {n.tags?.length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                    #{n.tags[0]}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Bottom actions                                                     */
/* ------------------------------------------------------------------ */
function LessonActions({ lesson, onCompleteLesson }) {
  return (
    <div className="max-w-3xl mx-auto px-4 pt-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Link
          to={`/lesson/${lesson.id}`}
          className="text-center py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm shadow-sm"
        >
          Open Lesson Plan
        </Link>
        <Link
          to={`/lesson/${lesson.id}?guided=1`}
          className="text-center py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-sm"
        >
          ▶ Start Guided Mode
        </Link>
        <button
          onClick={onCompleteLesson}
          className="text-center py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm shadow-sm"
        >
          ✓ Complete & Advance
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function Modal({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-5 shadow-xl"
      >
        {children}
      </div>
    </div>
  );
}

function ContextSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 pt-4 space-y-3 animate-pulse">
      <div className="h-24 bg-white rounded-2xl" />
      <div className="h-56 bg-white rounded-2xl" />
      <div className="h-32 bg-white rounded-2xl" />
    </div>
  );
}

function EmptyDay() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6 pb-20">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-3">🗓️</div>
        <h2 className="text-xl font-semibold text-slate-800">Let's set up your week</h2>
        <p className="text-sm text-slate-500 mt-1">
          Add your timetable slots and this screen will always show what you are teaching
          right now — and what's next.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center mt-5">
          <Link
            to="/schedule"
            className="px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-medium"
          >
            Build my timetable
          </Link>
          <Link
            to="/curriculum"
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium"
          >
            Add curriculum
          </Link>
        </div>
      </div>
    </div>
  );
}
