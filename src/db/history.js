import { db } from './schema';

/**
 * Query lessons with rich filters, then hydrate each with subject/standard/activities.
 */
export async function queryLessons({
  from = null,        // "YYYY-MM-DD" inclusive
  to = null,          // "YYYY-MM-DD" inclusive
  subjectId = null,
  standardId = null,
  status = null,      // 'planned' | 'in_progress' | 'done' | 'postponed'
  search = '',        // matches standard indicator / contentStandard / note body
  sort = 'desc',      // 'desc' | 'asc' by date
} = {}) {
  let lessons = await db.lessons.toArray();

  // --- Date range ---
  if (from) lessons = lessons.filter(l => l.date >= from);
  if (to)   lessons = lessons.filter(l => l.date <= to);

  // --- Slot & subject / standard filters ---
  const slots = Object.fromEntries((await db.timetable.toArray()).map(s => [s.id, s]));
  if (subjectId) {
    lessons = lessons.filter(l => slots[l.timetableId]?.subjectId === subjectId);
  }
  if (standardId) {
    lessons = lessons.filter(l => l.standardId === standardId);
  }
  if (status) {
    lessons = lessons.filter(l => (l.status || 'planned') === status);
  }

  // --- Sort ---
  lessons.sort((a, b) =>
    sort === 'asc'
      ? a.date.localeCompare(b.date)
      : b.date.localeCompare(a.date)
  );

  // --- Hydrate ---
  const subjects = Object.fromEntries((await db.subjects.toArray()).map(s => [s.id, s]));
  const rows = [];
  for (const lesson of lessons) {
    const slot = slots[lesson.timetableId] || null;
    const subject = slot ? subjects[slot.subjectId] : null;
    const standard = lesson.standardId ? await db.standards.get(lesson.standardId) : null;

    const [activities, notes] = await Promise.all([
      db.activities.where('lessonId').equals(lesson.id).sortBy('order'),
      db.notes.where('lessonId').equals(lesson.id).toArray(),
    ]);

    rows.push({
      lesson, slot, subject, standard,
      activities, notes,
      totalMin: activities.reduce((s, a) => s + (a.duration || 0), 0),
      doneCount: activities.filter(a => a.done).length,
    });
  }

  // --- Full-text search (post-hydration, matches standard + notes) ---
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    return rows.filter(r =>
      (r.standard?.indicator || '').toLowerCase().includes(q) ||
      (r.standard?.contentStandard || '').toLowerCase().includes(q) ||
      (r.subject?.name || '').toLowerCase().includes(q) ||
      r.notes.some(n => (n.body || '').toLowerCase().includes(q))
    );
  }

  return rows;
}

/**
 * Aggregated stats for the current filter set.
 */
export function computeStats(rows) {
  const bySubject = {};
  const byActivityType = {};
  const byStandard = {};
  let totalMin = 0;
  let completed = 0;

  for (const r of rows) {
    if (r.subject) {
      bySubject[r.subject.name] = (bySubject[r.subject.name] || 0) + 1;
    }
    if (r.standard) {
      byStandard[r.standard.id] = {
        indicator: r.standard.indicator,
        count: (byStandard[r.standard.id]?.count || 0) + 1,
      };
    }
    for (const a of r.activities) {
      byActivityType[a.type] = (byActivityType[a.type] || 0) + 1;
      totalMin += a.duration || 0;
    }
    if (r.lesson.status === 'done') completed++;
  }

  return {
    totalLessons: rows.length,
    completed,
    totalMin,
    bySubject,
    byActivityType,
    byStandard: Object.values(byStandard).sort((a, b) => b.count - a.count),
  };
}

/**
 * CSV export — one row per lesson.
 */
export function toCSV(rows) {
  const header = [
    'date','classLevel','subject','startTime','endTime','room',
    'status','standard','indicator','activityCount','doneCount','totalMinutes','notes',
  ];
  const escape = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push([
      r.lesson.date,
      r.slot?.classLevel || '',
      r.subject?.name || '',
      r.slot?.startTime || '',
      r.slot?.endTime || '',
      r.slot?.room || '',
      r.lesson.status || 'planned',
      r.standard?.contentStandard || '',
      r.standard?.indicator || '',
      r.activities.length,
      r.doneCount,
      r.totalMin,
      r.notes.map(n => n.body).join(' | '),
    ].map(escape).join(','));
  }
  return lines.join('\n');
}

/**
 * Download as a Blob. Works offline.
 */
export function downloadFile(filename, content, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
