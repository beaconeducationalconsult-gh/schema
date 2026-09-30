import { db } from './schema';
import { toDateKey, settings, standards } from './helpers';
import { weekDays } from '../lib/week';

/**
 * Resolve the active curriculum standard context { standard, subStrand, strand, subject }
 * for a given subjectId using `currentStandardBySubject` pointer first, then first standard.
 */
export async function resolveStandardForSubject(subjectId) {
  if (!subjectId) return null;

  const pointer = await settings.getCurrentStandard(subjectId);
  if (pointer) {
    const ctx = await standards.withContext(pointer);
    if (ctx && ctx.standard) return ctx;
  }

  const strands = await db.strands.where('subjectId').equals(subjectId).sortBy('order');
  for (const strand of strands) {
    const subs = await db.subStrands.where('strandId').equals(strand.id).sortBy('order');
    for (const sub of subs) {
      const stds = await db.standards.where('subStrandId').equals(sub.id).sortBy('order');
      if (stds.length > 0) {
        const subject = await db.subjects.get(subjectId);
        return { standard: stds[0], subStrand: sub, strand, subject };
      }
    }
  }
  return null;
}

/**
 * Load everything needed for a week grid:
 * - slots grouped by dayOfWeek (1=Mon … 5=Fri, 6=Sat, 7=Sun)
 * - subjects keyed by id
 * - existing lessons for the date range keyed by `${timetableId}:${date}`
 */
export async function loadWeek(weekStart, { includeWeekend = false } = {}) {
  const days = weekDays(weekStart, { includeWeekend });

  const dayNumbers = days.map(d => {
    const g = d.getDay();      // 0..6 (Sun=0)
    return g === 0 ? 7 : g;    // convert to 1..7, Mon=1
  });

  const [slotsAll, subjectsAll] = await Promise.all([
    db.timetable.toArray(),
    db.subjects.toArray(),
  ]);

  const slots = slotsAll
    .filter(s => dayNumbers.includes(s.dayOfWeek))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const subjects = Object.fromEntries(subjectsAll.map(s => [s.id, s]));

  // Existing lessons for the week (date in the range)
  const fromKey = toDateKey(days[0]);
  const toKey   = toDateKey(days[days.length - 1]);
  const lessonsInWeek = await db.lessons.where('date').between(fromKey, toKey, true, true).toArray();
  const lessons = {};
  for (const l of lessonsInWeek) lessons[`${l.timetableId}:${l.date}`] = l;

  // Group slots by dayNumber
  const slotsByDay = {};
  for (const n of dayNumbers) slotsByDay[n] = [];
  for (const s of slots) {
    if (!slotsByDay[s.dayOfWeek]) slotsByDay[s.dayOfWeek] = [];
    slotsByDay[s.dayOfWeek].push(s);
  }

  return { days, dayNumbers, slotsByDay, subjects, lessons };
}

export async function ensureLessonFor(slot, date) {
  const dateKey = typeof date === 'string' ? date : toDateKey(date);
  const existing = await db.lessons
    .where({ timetableId: slot.id, date: dateKey })
    .first();
  if (existing) return existing;

  const ctx = await resolveStandardForSubject(slot.subjectId);
  const standardId = ctx?.standard?.id || null;

  const id = await db.lessons.add({
    timetableId: slot.id,
    standardId,
    date: dateKey,
    status: 'planned',
    createdAt: Date.now(),
  });
  return db.lessons.get(id);
}
