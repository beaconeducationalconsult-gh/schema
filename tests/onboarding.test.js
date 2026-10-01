import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../src/db/schema';
import { completeOnboarding, migrateExistingInstall } from '../src/db/onboarding';
import { getSettings, isOnboarded, resetSettings } from '../src/db/settings';
import { resetToSeed, importBackup, exportBackup } from '../src/db/backup';

const TABLES = ['subjects', 'strands', 'subStrands', 'standards', 'timetable', 'lessons', 'activities', 'notes', 'resources', 'settings'];
beforeEach(async () => { for (const t of TABLES) await db[t].clear(); });

const profile = { teacherName: ' Ama Owusu ', schoolName: 'Test School', classLevel: 'Basic 4', academicYear: '2026/2027' };

describe('onboarding', () => {
  it('is not onboarded on an empty database', async () => {
    await migrateExistingInstall();
    expect(await isOnboarded()).toBe(false);
  });

  it('flags installs that already have data, so they skip the wizard', async () => {
    await db.subjects.add({ name: 'Maths', order: 0 });
    await migrateExistingInstall();
    expect(await isOnboarded()).toBe(true);
  });

  it('saves the profile and terms, and creates the picked subjects (blank start)', async () => {
    const terms = [{ label: 'T1', from: '2026-09-01', to: '2026-12-01' }];
    await completeOnboarding({ profile, terms, subjectNames: ['Mathematics', ' Science ', 'mathematics', ''] });
    const s = await getSettings();
    expect(s.teacherName).toBe('Ama Owusu');
    expect(s.schoolName).toBe('Test School');
    expect(s.terms).toEqual(terms);
    const subjects = await db.subjects.orderBy('order').toArray();
    expect(subjects.map((x) => x.name)).toEqual(['Mathematics', 'Science']);
    expect(subjects[0].icon).toBe('sigma');
    expect(subjects[0].color).not.toBe(subjects[1].color);
    expect(await db.timetable.count()).toBe(0); // no demo content
    expect(await isOnboarded()).toBe(true);
  });

  it('demo start loads sample data but keeps the teacher’s own profile', async () => {
    await completeOnboarding({ profile, useDemo: true, subjectNames: ['Ignored'] });
    expect(await db.timetable.count()).toBeGreaterThan(0);
    expect((await db.subjects.toArray()).some((x) => x.name === 'Ignored')).toBe(false);
    const s = await getSettings();
    expect(s.teacherName).toBe('Ama Owusu');
    expect(s.schoolName).toBe('Test School');
  });

  it('defaults follow today’s date rather than a hardcoded year', async () => {
    const s = await getSettings();
    expect(s.schoolName).toBe('');
    expect(s.academicYear).toMatch(/^\d{4}\/\d{4}$/);
    expect(s.terms).toHaveLength(3);
  });

  it('stays onboarded after a settings reset, a demo reset and a backup restore', async () => {
    await completeOnboarding({ profile, subjectNames: [] });
    await resetSettings();
    expect(await isOnboarded()).toBe(true);

    await db.settings.clear();
    await resetToSeed();
    expect(await isOnboarded()).toBe(true);

    const snap = await exportBackup();
    snap.data.settings = snap.data.settings.filter((r) => r.key !== 'onboarded'); // old backup
    await db.settings.clear();
    await importBackup(snap, { mode: 'replace' });
    expect(await isOnboarded()).toBe(true);
  });
});
