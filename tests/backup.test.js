import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../src/db/schema';
import { exportBackup, importBackup, validateBackup } from '../src/db/backup';

const TABLES = [
  'subjects', 'strands', 'subStrands', 'standards', 'timetable',
  'lessons', 'activities', 'notes', 'resources', 'settings',
];

async function clearAll() {
  for (const t of TABLES) await db[t].clear();
}

/** One subject → strand → sub-strand → standard, with a slot, lesson, activity, note and resource. */
async function seedChain(label) {
  const subjectId = await db.subjects.add({ name: label, order: 0 });
  const strandId = await db.strands.add({ subjectId, name: `${label} strand`, order: 0 });
  const subStrandId = await db.subStrands.add({ strandId, name: `${label} sub`, order: 0 });
  const standardId = await db.standards.add({ subStrandId, indicator: `${label} ind`, order: 0 });
  const timetableId = await db.timetable.add({ dayOfWeek: 1, startTime: '08:00', endTime: '08:40', subjectId });
  const lessonId = await db.lessons.add({ timetableId, standardId, date: '2026-10-05', status: 'planned' });
  await db.activities.add({ lessonId, type: 'exercise', title: `${label} act`, order: 0 });
  await db.notes.add({ lessonId, standardId, tags: ['x'], createdAt: 1 });
  await db.resources.add({ standardId, type: 'image', url: 'u', caption: 'c' });
  await db.settings.put({ key: 'currentStandardBySubject', value: { [subjectId]: standardId } });
  return { subjectId, standardId };
}

beforeEach(clearAll);

describe('backup', () => {
  it('rejects files that are not backups or are from a newer schema', async () => {
    expect(() => validateBackup(null)).toThrow();
    expect(() => validateBackup({ meta: { app: 'Other' }, data: {} })).toThrow(/not produced/);
    const snap = await exportBackup();
    snap.meta.schemaVersion = db.verno + 1;
    expect(() => validateBackup(snap)).toThrow(/newer version/);
  });

  it('round-trips with replace', async () => {
    await seedChain('A');
    const snap = await exportBackup();
    await clearAll();
    await seedChain('junk');
    await importBackup(snap, { mode: 'replace' });
    expect((await db.subjects.toArray()).map((s) => s.name)).toEqual(['A']);
    expect(await db.lessons.count()).toBe(1);
  });

  it('merge re-links foreign keys instead of colliding on ids', async () => {
    await seedChain('A');
    const snap = await exportBackup();

    // Wipe and create a *different* dataset whose ids collide with the backup's ids.
    // (Auto-increment counters survive clear(), so build B by replacing with a renamed
    // copy of the snapshot: same ids, different content.)
    const other = JSON.parse(JSON.stringify(snap));
    for (const t of ['subjects', 'strands', 'subStrands']) {
      other.data[t].forEach((r) => { r.name = r.name.replace('A', 'B'); });
    }
    other.data.standards.forEach((r) => { r.indicator = 'B ind'; });
    other.data.activities.forEach((r) => { r.title = 'B act'; });
    await importBackup(other, { mode: 'replace' });
    const mine = {
      subjectId: (await db.subjects.toArray())[0].id,
      standardId: (await db.standards.toArray())[0].id,
    };
    expect(mine.subjectId).toBe(snap.data.subjects[0].id); // ids really do collide

    await importBackup(snap, { mode: 'merge' });

    expect(await db.subjects.count()).toBe(2);
    expect(await db.lessons.count()).toBe(2);

    const a = (await db.subjects.toArray()).find((s) => s.name === 'A');
    const strand = await db.strands.where('subjectId').equals(a.id).first();
    expect(strand.name).toBe('A strand');
    const sub = await db.subStrands.where('strandId').equals(strand.id).first();
    const std = await db.standards.where('subStrandId').equals(sub.id).first();
    expect(std.indicator).toBe('A ind');

    const slot = await db.timetable.where('subjectId').equals(a.id).first();
    const lesson = await db.lessons.where('timetableId').equals(slot.id).first();
    expect(lesson.standardId).toBe(std.id);
    const act = await db.activities.where('lessonId').equals(lesson.id).first();
    expect(act.title).toBe('A act');
    expect((await db.notes.where('lessonId').equals(lesson.id).toArray())).toHaveLength(1);
    expect((await db.resources.where('standardId').equals(std.id).toArray())).toHaveLength(1);

    // B is untouched and its "current standard" pointer wins; A's pointer is added for A.
    const pointers = (await db.settings.get('currentStandardBySubject')).value;
    expect(pointers[mine.subjectId]).toBe(mine.standardId);
    expect(pointers[a.id]).toBe(std.id);
  });
});
