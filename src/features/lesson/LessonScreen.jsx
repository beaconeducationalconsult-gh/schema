import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { lessonsFull, standards as standardRepo } from '../../db/helpers';
import { db } from '../../db/schema';
import GuidedMode from './GuidedMode';
import PrintHeader from './PrintHeader';
import LessonToolbar from './LessonToolbar';
import LessonHeader from './LessonHeader';
import StandardCard from './StandardCard';
import StandardQuickEdit from './StandardQuickEdit';
import TeachingPlan from './TeachingPlan';
import NotesPanel from './NotesPanel';
import ActivityPicker from './ActivityPicker';
import { NoStandardBanner, NotFound } from './LessonStates';
import ResourceManagerModal from '../../components/ResourceManagerModal';
import RoutineTemplateModal from '../../components/RoutineTemplateModal';
import CompleteLessonModal from '../../components/CompleteLessonModal';

const EMPTY = [];

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

      <LessonToolbar
        data={data}
        onRoutine={() => setRoutineOpen(true)}
        onAddActivity={() => setPickerOpen(true)}
        onComplete={() => setCompleteOpen(true)}
      />

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
          <NoStandardBanner
            allStandards={allStandards}
            onLink={async (id) => {
              await lessonsFull.update(lesson.id, { standardId: id });
            }}
          />
        )}

        <TeachingPlan
          lessonId={lesson.id}
          activities={activities}
          onRoutine={() => setRoutineOpen(true)}
          onAddActivity={() => setPickerOpen(true)}
        />

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
