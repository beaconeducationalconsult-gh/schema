import { db } from './schema';
import { ensureLessonFor, resolveStandardForSubject } from './schedule';
import {
  standards as standardRepo,
  resources as resourceRepo,
  notes as noteRepo,
  activities as activityRepo,
} from './helpers';

/**
 * Get (or create) the lesson for a timetable slot on a date, and make sure it
 * points at a standard — the subject's "current" one, else its first.
 * This WRITES, so call it from an effect/event, never from a live query.
 */
export async function ensureNowLesson(slot, date) {
  const lesson = await ensureLessonFor(slot, date);
  if (lesson && !lesson.standardId) {
    const resolved = await resolveStandardForSubject(slot.subjectId);
    if (resolved?.standard) {
      await db.lessons.update(lesson.id, { standardId: resolved.standard.id });
      return { ...lesson, standardId: resolved.standard.id };
    }
  }
  return lesson;
}

/**
 * Everything the Now screen shows for a slot's lesson, read-only so it can sit
 * inside `useLiveQuery` and refresh whenever any of these tables change.
 */
export async function loadNowContext(slotId, lessonId) {
  const [slot, lesson] = await Promise.all([
    db.timetable.get(slotId),
    db.lessons.get(lessonId),
  ]);
  if (!slot || !lesson) return null;

  const subject = (await db.subjects.get(slot.subjectId)) || null;

  // Every standard of the subject, flattened, for the "switch standard" picker.
  const subjectStandards = [];
  if (subject) {
    const strands = await db.strands.where('subjectId').equals(subject.id).sortBy('order');
    for (const st of strands) {
      const subs = await db.subStrands.where('strandId').equals(st.id).sortBy('order');
      for (const sub of subs) {
        const stds = await db.standards.where('subStrandId').equals(sub.id).sortBy('order');
        for (const std of stds) {
          subjectStandards.push({ ...std, _strandName: st.name, _subStrandName: sub.name });
        }
      }
    }
  }

  let standard = null, subStrand = null, strand = null;
  if (lesson.standardId) {
    const ctx = await standardRepo.withContext(lesson.standardId);
    if (ctx) ({ standard, subStrand, strand } = ctx);
  }

  const [resources, notes, activities] = await Promise.all([
    standard ? resourceRepo.byStandard(standard.id) : [],
    noteRepo.byLesson(lesson.id),
    activityRepo.byLesson(lesson.id),
  ]);

  return {
    slot,
    subject,
    strand,
    subStrand,
    standard,
    lesson,
    subjectStandards,
    resources,
    recentNotes: notes.slice(0, 4),
    activities,
  };
}
