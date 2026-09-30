// Dexie table definitions + versioning
import Dexie from 'dexie';

export const db = new Dexie('TeachingCompanion');

db.version(1).stores({
  // Core curriculum
  subjects:   '++id, name, color, icon, order',
  strands:    '++id, subjectId, name, order',
  subStrands: '++id, strandId, name, order',
  standards:  '++id, subStrandId, indicator, contentStandard, order',

  // Scheduling
  timetable:  '++id, dayOfWeek, startTime, endTime, subjectId, classLevel, room, [dayOfWeek+startTime]',

  // Teaching artifacts
  lessons:    '++id, standardId, timetableId, date, status, createdAt',
  activities: '++id, lessonId, type, order, duration, title, content',
  notes:      '++id, lessonId, standardId, tags, createdAt',
  resources:  '++id, standardId, type, url, caption',

  // Meta
  settings:   'key',
});

export const ACTIVITY_TYPES = [
  'exercise',
  'correction',
  'image_observation',
  'video',
  'reading',
  'discussion',
  'assignment',
];
