import { describe, it, expect } from 'vitest';
import Dexie from 'dexie';

describe('schema v1 → v2 upgrade', () => {
  it('keeps existing data and adds the [timetableId+date] index', async () => {
    // Build a database exactly as shipped in v1.
    const old = new Dexie('TeachingCompanion');
    old.version(1).stores({
      subjects: '++id, name, color, icon, order',
      strands: '++id, subjectId, name, order',
      subStrands: '++id, strandId, name, order',
      standards: '++id, subStrandId, indicator, contentStandard, order',
      timetable: '++id, dayOfWeek, startTime, endTime, subjectId, classLevel, room, [dayOfWeek+startTime]',
      lessons: '++id, standardId, timetableId, date, status, createdAt',
      activities: '++id, lessonId, type, order, duration, title, content',
      notes: '++id, lessonId, standardId, tags, createdAt',
      resources: '++id, standardId, type, url, caption',
      settings: 'key',
    });
    await old.lessons.add({ timetableId: 7, date: '2026-10-05', status: 'planned' });
    await old.notes.add({ lessonId: 1, tags: ['a', 'b'], createdAt: 1 });
    old.close();

    const { db } = await import('../src/db/schema');
    await db.open();

    expect(db.verno).toBe(2);
    expect(await db.lessons.count()).toBe(1);
    const hit = await db.lessons.where({ timetableId: 7, date: '2026-10-05' }).first();
    expect(hit).toBeTruthy();
    expect(await db.notes.where('tags').equals('b').count()).toBe(1);
  });
});
