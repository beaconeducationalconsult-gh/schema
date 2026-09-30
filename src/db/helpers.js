// Typed accessors + convenience queries
import { db } from './schema';

/* ---------- Subjects ---------- */
export const subjects = {
  all: () => db.subjects.orderBy('order').toArray(),
  get: (id) => db.subjects.get(id),
  add: (data) => db.subjects.add(data),
  update: (id, patch) => db.subjects.update(id, patch),
  remove: (id) => db.subjects.delete(id),
};

/* ---------- Standards (the FK hub) ---------- */
export const standards = {
  bySubStrand: (subStrandId) =>
    db.standards.where('subStrandId').equals(subStrandId).sortBy('order'),

  // Full chain: standard → subStrand → strand → subject
  withContext: async (id) => {
    if (!id) return null;
    const standard = await db.standards.get(id);
    if (!standard) return null;
    const subStrand = await db.subStrands.get(standard.subStrandId);
    if (!subStrand) return { standard, subStrand: null, strand: null, subject: null };
    const strand = await db.strands.get(subStrand.strandId);
    if (!strand) return { standard, subStrand, strand: null, subject: null };
    const subject = await db.subjects.get(strand.subjectId);
    return { standard, subStrand, strand, subject };
  },
};

/* ---------- Timetable ---------- */
export const timetable = {
  all: () => db.timetable.toArray(),
  byDay: (dayOfWeek) =>
    db.timetable.where('dayOfWeek').equals(dayOfWeek).sortBy('startTime'),
  get: (id) => db.timetable.get(id),
  add: (data) => db.timetable.add(data),
  update: (id, patch) => db.timetable.update(id, patch),
  remove: (id) => db.timetable.delete(id),
};

/* ---------- Lessons ---------- */
export const lessons = {
  // Auto-create or fetch a lesson for today's timetable slot
  ensureForSlot: async ({ timetableId, standardId, date }) => {
    const dateKey = typeof date === 'string' ? date : toDateKey(date);
    const existing = await db.lessons
      .where({ timetableId, date: dateKey })
      .first();
    if (existing) {
      if (standardId && !existing.standardId) {
        await db.lessons.update(existing.id, { standardId });
        return db.lessons.get(existing.id);
      }
      return existing;
    }

    const id = await db.lessons.add({
      timetableId,
      standardId,
      date: dateKey,
      status: 'planned',
      createdAt: Date.now(),
    });
    return db.lessons.get(id);
  },
  get: (id) => db.lessons.get(id),
  byDate: (date) => db.lessons.where('date').equals(toDateKey(date)).toArray(),
};

/* ---------- Activities ---------- */
export const activities = {
  byLesson: (lessonId) =>
    db.activities.where('lessonId').equals(lessonId).sortBy('order'),
  add: async (data) => {
    const count = await db.activities.where('lessonId').equals(data.lessonId).count();
    return db.activities.add({ ...data, order: count });
  },
  bulkAddForLesson: async (lessonId, items) => {
    const existingCount = await db.activities.where('lessonId').equals(lessonId).count();
    const rows = items.map((item, i) => ({
      lessonId,
      type: item.type,
      title: item.title,
      content: item.content || '',
      duration: Number(item.duration) || 10,
      done: false,
      order: existingCount + i,
    }));
    await db.activities.bulkAdd(rows);
    return db.activities.where('lessonId').equals(lessonId).sortBy('order');
  },
  update: (id, patch) => db.activities.update(id, patch),
  remove: (id) => db.activities.delete(id),
  reorder: async (lessonId, orderedIds) => {
    await db.transaction('rw', db.activities, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.activities.update(orderedIds[i], { order: i });
      }
    });
  },
};

export const activityRepo = activities;

/* ---------- Resources (attached to Standards) ---------- */
export const resources = {
  all: () => db.resources.toArray(),
  byStandard: (standardId) =>
    standardId ? db.resources.where('standardId').equals(standardId).toArray() : Promise.resolve([]),
  add: (data) => db.resources.add(data),
  update: (id, patch) => db.resources.update(id, patch),
  remove: (id) => db.resources.delete(id),
};

/* ---------- Notes ---------- */
export const notes = {
  all: () => db.notes.reverse().sortBy('createdAt'),
  byLesson: (lessonId) =>
    db.notes.where('lessonId').equals(lessonId).reverse().sortBy('createdAt'),
  byStandard: (standardId) =>
    db.notes.where('standardId').equals(standardId).reverse().sortBy('createdAt'),
  add: (data) =>
    db.notes.add({
      tags: [],
      ...data,
      createdAt: data.createdAt || Date.now(),
    }),
  update: (id, patch) => db.notes.update(id, patch),
  remove: (id) => db.notes.delete(id),

  // Hydrate all notes with their lesson, standard, and subject context
  allWithContext: async () => {
    const [allNotes, allLessons, allSlots, allSubjects, allStandards, allSubStrands, allStrands] =
      await Promise.all([
        db.notes.toArray(),
        db.lessons.toArray(),
        db.timetable.toArray(),
        db.subjects.toArray(),
        db.standards.toArray(),
        db.subStrands.toArray(),
        db.strands.toArray(),
      ]);

    const lessonMap = Object.fromEntries(allLessons.map(l => [l.id, l]));
    const slotMap = Object.fromEntries(allSlots.map(s => [s.id, s]));
    const subjectMap = Object.fromEntries(allSubjects.map(s => [s.id, s]));
    const standardMap = Object.fromEntries(allStandards.map(s => [s.id, s]));
    const subStrandMap = Object.fromEntries(allSubStrands.map(s => [s.id, s]));
    const strandMap = Object.fromEntries(allStrands.map(s => [s.id, s]));

    return allNotes
      .slice()
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .map(note => {
        const lesson = note.lessonId ? lessonMap[note.lessonId] || null : null;
        const stdId = note.standardId || lesson?.standardId || null;
        const standard = stdId ? standardMap[stdId] || null : null;
        const subStrand = standard ? subStrandMap[standard.subStrandId] || null : null;
        const strand = subStrand ? strandMap[subStrand.strandId] || null : null;
        const slot = lesson?.timetableId ? slotMap[lesson.timetableId] || null : null;
        const subjectId = strand?.subjectId || slot?.subjectId || note.subjectId || null;
        const subject = subjectId ? subjectMap[subjectId] || null : null;

        return {
          note,
          lesson,
          slot,
          standard,
          subStrand,
          strand,
          subject,
        };
      });
  },
};

/* ---------- Settings repo ---------- */
export const settings = {
  async get(key, fallback = null) {
    const row = await db.settings.get(key);
    return row ? row.value : fallback;
  },
  async set(key, value) {
    await db.settings.put({ key, value });
  },
  async getCurrentStandard(subjectId) {
    const map = await settings.get('currentStandardBySubject', {});
    return map[subjectId] || null;
  },
  async setCurrentStandard(subjectId, standardId) {
    const map = await settings.get('currentStandardBySubject', {});
    map[subjectId] = standardId;
    await settings.set('currentStandardBySubject', map);
  },
};

/* ---------- Full Lesson Hydration ---------- */
export const lessonsFull = {
  async hydrate(lessonId) {
    const lesson = await db.lessons.get(lessonId);
    if (!lesson) return null;

    const [slot, chain, acts, lessonNotes, stdResources] = await Promise.all([
      lesson.timetableId ? db.timetable.get(lesson.timetableId) : null,
      lesson.standardId ? standards.withContext(lesson.standardId) : null,
      db.activities.where('lessonId').equals(lessonId).sortBy('order'),
      db.notes.where('lessonId').equals(lessonId).reverse().sortBy('createdAt'),
      lesson.standardId
        ? db.resources.where('standardId').equals(lesson.standardId).toArray()
        : [],
    ]);

    let subject = chain?.subject || null;
    if (!subject && slot?.subjectId) {
      subject = await db.subjects.get(slot.subjectId);
    }

    return {
      lesson,
      slot,
      subject,
      strand: chain?.strand || null,
      subStrand: chain?.subStrand || null,
      standard: chain?.standard || null,
      activities: acts,
      notes: lessonNotes,
      resources: stdResources,
    };
  },

  async update(id, patch) {
    return db.lessons.update(id, patch);
  },
};

/* ---------- Utils ---------- */
export function toDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function toMin(hhmm) {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
