import { toDateKey } from '../db/helpers';

/**
 * Ghana's basic-school year starts in September. Returns the calendar year the
 * academic year began in for `date` (Aug–Dec → this year, Jan–Jul → last year).
 */
export function academicStartYear(date = new Date()) {
  return date.getMonth() >= 7 ? date.getFullYear() : date.getFullYear() - 1;
}

/** "2026/2027" */
export function defaultAcademicYear(date = new Date()) {
  const y = academicStartYear(date);
  return `${y}/${y + 1}`;
}

/** Suggested three-term calendar for the academic year starting in `startYear`. Teachers adjust to their GES calendar. */
export function defaultTerms(startYear = academicStartYear()) {
  const d = (y, m, day) => toDateKey(new Date(y, m - 1, day));
  return [
    { label: 'Term 1', from: d(startYear, 9, 8), to: d(startYear, 12, 18) },
    { label: 'Term 2', from: d(startYear + 1, 1, 12), to: d(startYear + 1, 4, 16) },
    { label: 'Term 3', from: d(startYear + 1, 5, 4), to: d(startYear + 1, 7, 30) },
  ];
}

/**
 * The term containing `date`, or null (holidays / no terms configured).
 * Works with the `{ label, from, to }` objects stored in settings (YYYY-MM-DD strings).
 */
export function currentTerm(terms, date = new Date()) {
  const key = toDateKey(date);
  return (terms || []).find((t) => t.from && t.to && key >= t.from && key <= t.to) || null;
}

/** Class levels offered as suggestions in forms. */
export const CLASS_LEVELS = [
  'KG 1', 'KG 2',
  'Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6',
  'Basic 7 (JHS 1)', 'Basic 8 (JHS 2)', 'Basic 9 (JHS 3)',
];

/** Common basic-school subjects offered during onboarding. */
export const COMMON_SUBJECTS = [
  'Mathematics',
  'English Language',
  'Science',
  'Social Studies',
  'Religious and Moral Education',
  'Computing',
  'Creative Arts',
  'Our World Our People',
  'Ghanaian Language',
  'French',
  'Physical Education',
];
