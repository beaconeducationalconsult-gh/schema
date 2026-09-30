import { db } from './schema';
import { saveSettings, isOnboarded, markOnboarded } from './settings';
import { seedIfEmpty } from './seed';

const SUBJECT_COLORS = ['#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#4f46e5', '#be185d'];
const SUBJECT_ICONS = {
  'mathematics': 'sigma',
  'english language': 'book',
  'science': 'flask',
  'social studies': 'globe',
  'computing': 'code',
  'creative arts': 'palette',
  'our world our people': 'leaf',
  'ghanaian language': 'book',
  'french': 'book',
  'religious and moral education': 'book',
  'physical education': 'leaf',
};

/**
 * Installs that predate onboarding already have data: flag them as set up so
 * they never see the wizard.
 */
export async function migrateExistingInstall() {
  if (await isOnboarded()) return;
  if ((await db.subjects.count()) > 0) await markOnboarded();
}

/**
 * Finish first-run setup.
 * @param {object}   opts
 * @param {object}   opts.profile      { teacherName, schoolName, classLevel, academicYear }
 * @param {object[]} opts.terms        [{ label, from, to }]
 * @param {string[]} opts.subjectNames subjects to create (ignored when useDemo)
 * @param {boolean}  opts.useDemo      load the demo curriculum/timetable instead
 */
export async function completeOnboarding({ profile, terms, subjectNames = [], useDemo = false }) {
  const clean = Object.fromEntries(
    Object.entries(profile || {}).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
  );
  await saveSettings({ ...clean, ...(terms ? { terms } : {}) });

  if (useDemo) {
    await seedIfEmpty();
  } else {
    const existing = await db.subjects.count();
    const seen = new Set();
    const names = subjectNames
      .map((n) => n.trim())
      .filter((n) => n && !seen.has(n.toLowerCase()) && seen.add(n.toLowerCase()));
    await db.subjects.bulkAdd(
      names.map((name, i) => ({
        name,
        color: SUBJECT_COLORS[(existing + i) % SUBJECT_COLORS.length],
        icon: SUBJECT_ICONS[name.toLowerCase()] || 'book',
        order: existing + i,
      }))
    );
  }
  await markOnboarded();
}
