import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
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
import ResourceManagerModal from '../../components/ResourceManagerModal';
import RoutineTemplateModal from '../../components/RoutineTemplateModal';
import CompleteLessonModal from '../../components/CompleteLessonModal';
import StatusBanner from './StatusBanner';
import ClassCard from './ClassCard';
import CurriculumCard, { NoStandardCard } from './CurriculumCard';
import ActivityPromptBar from './ActivityPromptBar';
import ActivityFeed from './ActivityFeed';
import NotesStrip from './NotesStrip';
import LessonActions from './LessonActions';
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
