import { db } from './schema';
import { seedIfEmpty } from './seed';
import { markOnboarded } from './settings';

const BACKUP_TABLES = [
  'subjects', 'strands', 'subStrands', 'standards',
  'timetable', 'lessons', 'activities', 'notes', 'resources',
  'settings',
];

const LAST_EXPORT_KEY = 'lastBackupAt';

export async function markExported() {
  await db.settings.put({ key: LAST_EXPORT_KEY, value: Date.now() });
}

export async function daysSinceExport() {
  const row = await db.settings.get(LAST_EXPORT_KEY);
  if (!row) return null;
  return Math.floor((Date.now() - row.value) / (1000 * 60 * 60 * 24));
}

export async function exportBackup() {
  const data = {};
  for (const table of BACKUP_TABLES) {
    data[table] = await db[table].toArray();
  }
  return {
    meta: {
      app: 'TeachingCompanion',
      schemaVersion: db.verno,
      exportedAt: new Date().toISOString(),
      counts: Object.fromEntries(
        BACKUP_TABLES.map(t => [t, data[t].length])
      ),
    },
    data,
  };
}

export function serializeBackup(snapshot) {
  return JSON.stringify(snapshot, null, 2);
}

export function validateBackup(obj) {
  if (!obj || typeof obj !== 'object') throw new Error('Not a valid backup file.');
  if (!obj.meta || obj.meta.app !== 'TeachingCompanion') {
    throw new Error('This file was not produced by Teaching Companion.');
  }
  if (!obj.data || typeof obj.data !== 'object') {
    throw new Error('Backup is missing its data section.');
  }
  if (obj.meta.schemaVersion > db.verno) {
    throw new Error(
      'This backup was made by a newer version of the app. Update the app and try again.'
    );
  }
  const missing = BACKUP_TABLES.filter(t => !Array.isArray(obj.data[t]));
  if (missing.length) {
    throw new Error(`Backup is missing tables: ${missing.join(', ')}`);
  }
  return true;
}

// Foreign keys per table, used to re-link rows when merging (ids differ between devices).
// Order matters: parents are inserted before children.
//
// `identity` says what makes two rows "the same thing" once their foreign keys
// have been re-linked. That is what lets you merge the same backup twice (or a
// backup that overlaps what is already on the device) without duplicating data.
const MERGE_ORDER = [
  { table: 'subjects',   fks: {}, identity: (r) => [r.name] },
  { table: 'strands',    fks: { subjectId: 'subjects' }, identity: (r) => [r.subjectId, r.name] },
  { table: 'subStrands', fks: { strandId: 'strands' }, identity: (r) => [r.strandId, r.name] },
  {
    table: 'standards',
    fks: { subStrandId: 'subStrands' },
    identity: (r) => [r.subStrandId, r.code, r.contentStandard, r.indicator],
  },
  {
    table: 'timetable',
    fks: { subjectId: 'subjects' },
    identity: (r) => [r.dayOfWeek, r.startTime, r.endTime, r.subjectId],
  },
  {
    // One lesson per slot per day. Slot-less lessons are told apart by their standard.
    table: 'lessons',
    fks: { standardId: 'standards', timetableId: 'timetable' },
    identity: (r) => [r.timetableId, r.date, r.timetableId == null ? r.standardId : ''],
  },
  {
    table: 'activities',
    fks: { lessonId: 'lessons' },
    identity: (r) => [r.lessonId, r.type, r.title, r.content],
  },
  {
    table: 'notes',
    fks: { lessonId: 'lessons', standardId: 'standards' },
    identity: (r) => [r.lessonId, r.standardId, r.body, r.createdAt],
  },
  {
    table: 'resources',
    fks: { standardId: 'standards' },
    identity: (r) => [r.standardId, r.type, r.url, r.caption],
  },
];

const norm = (v) => (v == null ? '' : String(v).trim().toLowerCase());
const identityKey = (parts) => JSON.stringify(parts.map(norm));

/**
 * Merge. Every incoming row is either
 *  - matched to a row that is already here (same identity, see MERGE_ORDER) and
 *    skipped — the existing row wins, children are re-linked to it — or
 *  - added under a fresh auto-increment id with its foreign keys rewritten.
 * Matching is one-to-one against the rows that existed *before* the merge, so
 * genuine duplicates inside one backup are kept and re-importing is a no-op.
 * Settings: existing values win; per-subject "current standard" pointers are
 * carried over for subjects that have none.
 */
async function mergeBackup(data) {
  const idMap = {};
  const imported = {};
  const skipped = {};

  for (const { table, fks, identity } of MERGE_ORDER) {
    const map = (idMap[table] = new Map());
    imported[table] = 0;
    skipped[table] = 0;

    // Pool of pre-existing rows by identity; each incoming row may claim one.
    const pool = new Map();
    for (const row of await db[table].toArray()) {
      const key = identityKey(identity(row));
      if (!pool.has(key)) pool.set(key, []);
      pool.get(key).push(row.id);
    }

    for (const row of data[table] || []) {
      const { id: oldId, ...rest } = row;
      for (const [fk, parent] of Object.entries(fks)) {
        if (rest[fk] == null) continue;
        const mapped = idMap[parent].get(rest[fk]);
        // Orphaned reference in the backup: drop the link rather than point at a wrong row.
        rest[fk] = mapped ?? null;
      }

      const match = pool.get(identityKey(identity(rest)))?.shift();
      if (match != null) {
        if (oldId != null) map.set(oldId, match);
        skipped[table]++;
        continue;
      }
      const newId = await db[table].add(rest);
      if (oldId != null) map.set(oldId, newId);
      imported[table]++;
    }
  }

  // Settings
  imported.settings = 0;
  skipped.settings = 0;
  const pointerKey = 'currentStandardBySubject';
  for (const row of data.settings || []) {
    if (row.key === LAST_EXPORT_KEY) continue;
    if (row.key === pointerKey) {
      const current = (await db.settings.get(pointerKey))?.value || {};
      const merged = { ...current };
      let added = 0;
      for (const [oldSubject, oldStd] of Object.entries(row.value || {})) {
        const subj = idMap.subjects.get(Number(oldSubject));
        const std = idMap.standards.get(oldStd);
        if (subj != null && std != null && merged[subj] == null) {
          merged[subj] = std;
          added++;
        }
      }
      await db.settings.put({ key: pointerKey, value: merged });
      if (added) imported.settings++;
      else skipped.settings++;
    } else if (!(await db.settings.get(row.key))) {
      await db.settings.put(row);
      imported.settings++;
    } else {
      skipped.settings++;
    }
  }
  return { imported, skipped };
}

export async function importBackup(obj, { mode = 'replace' } = {}) {
  validateBackup(obj);

  const tables = BACKUP_TABLES.map(t => db[t]);
  let imported;
  let skipped = null;

  await db.transaction('rw', tables, async () => {
    if (mode === 'merge') {
      ({ imported, skipped } = await mergeBackup(obj.data));
      return;
    }
    for (const t of BACKUP_TABLES) await db[t].clear();
    for (const t of BACKUP_TABLES) {
      const rows = obj.data[t] || [];
      if (rows.length) await db[t].bulkPut(rows);
    }
    imported = Object.fromEntries(
      BACKUP_TABLES.map(t => [t, (obj.data[t] || []).length])
    );
  });

  // A restored backup means the app is already set up (older backups have no flag).
  await markOnboarded();

  return { imported, skipped, mode };
}

export async function resetToSeed() {
  const tables = BACKUP_TABLES.map(t => db[t]);
  await db.transaction('rw', tables, async () => {
    for (const t of BACKUP_TABLES) await db[t].clear();
  });
  await seedIfEmpty();
  await markOnboarded();
}

export async function databaseSummary() {
  const counts = {};
  for (const t of BACKUP_TABLES) counts[t] = await db[t].count();
  const estimate = await navigator.storage?.estimate?.().catch(() => null);
  return {
    counts,
    usageBytes: estimate?.usage ?? null,
    quotaBytes: estimate?.quota ?? null,
    persisted: await navigator.storage?.persisted?.().catch(() => false),
  };
}
