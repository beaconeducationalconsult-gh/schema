import { db } from './schema';
import { academicStartYear, defaultAcademicYear, defaultTerms } from '../lib/academicYear';

/** Fresh defaults. A function (not a constant) so the academic year and terms follow today's date. */
export function getDefaultSettings(now = new Date()) {
  return {
    schoolName: '',
    teacherName: '',
    classLevel: '',
    academicYear: defaultAcademicYear(now),

    // Term windows as { label, from, to } — dates are YYYY-MM-DD
    terms: defaultTerms(academicStartYear(now)),

    // Preferences
    prefs: {
      weekStartsOn: 1,          // 0=Sun, 1=Mon
      includeWeekend: false,
      reminderMinutes: 5,
      defaultActivityMinutes: 10,
    },

    // Set by Curriculum tab
    currentStandardBySubject: {},
  };
}

export const ONBOARDED_KEY = 'onboarded';

export async function isOnboarded() {
  return !!(await db.settings.get(ONBOARDED_KEY))?.value;
}

export async function markOnboarded() {
  await db.settings.put({ key: ONBOARDED_KEY, value: true });
}

/** Read a whole settings object, merged with defaults. */
export async function getSettings() {
  const rows = await db.settings.toArray();
  const stored = Object.fromEntries(rows.map(r => [r.key, r.value]));
  const defaults = getDefaultSettings();
  return {
    ...defaults,
    ...stored,
    prefs: { ...defaults.prefs, ...(stored.prefs || {}) },
    terms: stored.terms || defaults.terms,
  };
}

/** Write one or more keys. */
export async function saveSettings(patch) {
  const entries = Object.entries(patch);
  await db.transaction('rw', db.settings, async () => {
    for (const [key, value] of entries) {
      await db.settings.put({ key, value });
    }
  });
}

/** Reset everything back to defaults (does not touch curriculum/timetable). */
export async function resetSettings() {
  const onboarded = await db.settings.get(ONBOARDED_KEY);
  await db.settings.clear();
  await saveSettings(getDefaultSettings());
  if (onboarded) await db.settings.put(onboarded);
}
