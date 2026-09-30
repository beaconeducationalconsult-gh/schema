import { db } from './schema';

export const SETTINGS_DEFAULTS = {
  schoolName: 'Achimota Basic School',
  teacherName: 'Teacher',
  classLevel: 'Basic 6',
  academicYear: new Date().getFullYear().toString(),

  // Term windows as { label, from, to } — dates are YYYY-MM-DD
  terms: [
    { label: 'Term 1', from: '2026-09-08', to: '2026-12-18' },
    { label: 'Term 2', from: '2027-01-12', to: '2027-04-16' },
    { label: 'Term 3', from: '2027-05-04', to: '2027-07-30' },
  ],

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

/** Read a whole settings object, merged with defaults. */
export async function getSettings() {
  const rows = await db.settings.toArray();
  const stored = Object.fromEntries(rows.map(r => [r.key, r.value]));
  return {
    ...SETTINGS_DEFAULTS,
    ...stored,
    prefs: { ...SETTINGS_DEFAULTS.prefs, ...(stored.prefs || {}) },
    terms: stored.terms || SETTINGS_DEFAULTS.terms,
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
  await db.settings.clear();
  await saveSettings(SETTINGS_DEFAULTS);
}
