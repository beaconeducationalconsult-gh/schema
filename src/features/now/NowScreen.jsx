import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNow } from '../../hooks/useNow';
import {
  subjects as subjectRepo,
  activities as activityRepo,
  settings as settingsRepo,
  toDateKey,
} from '../../db/helpers';
import { ensureNowLesson, loadNowContext } from '../../db/now';
import { daysSinceExport } from '../../db/backup';
import { db } from '../../db/schema';
import { toast } from '../../lib/dialogs';
import ResourceManagerModal from '../../components/ResourceManagerModal';
import RoutineTemplateModal from '../../components/RoutineTemplateModal';
import CompleteLessonModal from '../../components/CompleteLessonModal';
import StatusBanner from './StatusBanner';
import TodayHero from './TodayHero';
import TeachingStepsCard from './TeachingStepsCard';
import NotesStrip from './NotesStrip';
import { ContextSkeleton, EmptyDay } from './NowStates';

const EMPTY_LIST = [];
const EMPTY_MAP = {};

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

  const subjectsMap = useLiveQuery(
    async () => Object.fromEntries((await subjectRepo.all()).map(s => [s.id, s])),
    [],
    EMPTY_MAP
  );
  const backupAgeDays = useLiveQuery(daysSinceExport, [], null);

  // Backup nudge as toast, not a persistent banner that pushes content down
  useEffect(() => {
    if (backupAgeDays == null || backupAgeDays <= 14) return;
    const key = 'tc-backup-toast-date';
    const today = toDateKey(new Date());
    try {
      if (localStorage.getItem(key) === today) return;
      localStorage.setItem(key, today);
    } catch {}
    toast(`It's been ${backupAgeDays} days since your last backup.`, {
      action: { label: 'Export now', onClick: () => { window.location.href = '/settings'; } },
    });
  }, [backupAgeDays]);

  const liveSlot = current || next;
  const fallbackSlot = slots[0] || allSlots[0] || null;
  const activeSlot = overrideSlotId
    ? allSlots.find(s => s.id === Number(overrideSlotId)) || liveSlot || fallbackSlot
    : liveSlot || fallbackSlot;
  const isPreviewMode = !!overrideSlotId || (!liveSlot && !!fallbackSlot);

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
  };

  if (!activeSlot && allSlots.length === 0) {
    return <EmptyDay />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-36">
      <StatusBanner
        isInClass={isInClass && !overrideSlotId}
        isPreviewMode={isPreviewMode}
        now={now}
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

      {loadingContext || !context ? (
        <ContextSkeleton />
      ) : (
        <>
          <TodayHero
            slot={context.slot}
            subject={context.subject}
            lesson={context.lesson}
            strand={context.strand}
            subStrand={context.subStrand}
            standard={context.standard}
            resources={stdResources}
            allStandards={subjectStandards}
            onSwitchStandard={handleSwitchStandard}
            onManageMedia={() => setMediaModalOpen(true)}
            isPreviewMode={isPreviewMode}
          />

          <TeachingStepsCard
            items={activityFeed}
            lessonId={context.lesson?.id}
            standard={context.standard}
            onOpenTemplates={() => setRoutineModalOpen(true)}
            onToggleDone={async (act) => {
              await activityRepo.update(act.id, { done: !act.done });
            }}
          />

          <NotesStrip lesson={context.lesson} notes={recentNotes} />

          {/* Sticky teach bar — one thumb zone for the core action */}
          {context.lesson && (
            <div className="max-w-3xl mx-auto px-4 pt-3">
              <div className="flex gap-2">
                <a
                  href={`/lesson/${context.lesson.id}?guided=1`}
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = `/lesson/${context.lesson.id}?guided=1`;
                  }}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm text-center shadow-sm min-h-[44px] flex items-center justify-center"
                >
                  ▶ Teach Now
                </a>
                <button
                  onClick={() => setCompleteModalOpen(true)}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm min-h-[44px]"
                >
                  ✓ Complete
                </button>
              </div>
              <div className="text-xs text-slate-500 text-center mt-1.5">
                {activityFeed.filter((a) => a.done).length}/{activityFeed.length} steps done · {activityFeed.reduce((s, a) => s + (a.duration || 0), 0)} min
                {activityFeed.length > 0 && (
                  <>
                    {' '}
                    · <a href={`/lesson/${context.lesson.id}`} className="text-blue-600 hover:underline">View plan</a>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {mediaModalOpen && context?.standard && (
        <ResourceManagerModal standard={context.standard} onClose={() => setMediaModalOpen(false)} />
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
