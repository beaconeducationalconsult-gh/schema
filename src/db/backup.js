import { db } from './schema';

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
  const missing = BACKUP_TABLES.filter(t => !Array.isArray(obj.data[t]));
  if (missing.length) {
    throw new Error(`Backup is missing tables: ${missing.join(', ')}`);
  }
  return true;
}

export async function importBackup(obj, { mode = 'replace' } = {}) {
  validateBackup(obj);

  const tables = BACKUP_TABLES.map(t => db[t]);

  await db.transaction('rw', tables, async () => {
    if (mode === 'replace') {
      for (const t of BACKUP_TABLES) await db[t].clear();
    }

    for (const t of BACKUP_TABLES) {
      const rows = obj.data[t] || [];
      if (!rows.length) continue;

      if (mode === 'merge') {
        for (const row of rows) {
          const pk = t === 'settings' ? row.key : row.id;
          if (pk != null && await db[t].get(pk)) continue;
          await db[t].put(row);
        }
      } else {
        await db[t].bulkPut(rows);
      }
    }
  });

  return {
    imported: Object.fromEntries(
      BACKUP_TABLES.map(t => [t, (obj.data[t] || []).length])
    ),
    mode,
  };
}

export async function resetToSeed() {
  const tables = BACKUP_TABLES.map(t => db[t]);
  await db.transaction('rw', tables, async () => {
    for (const t of BACKUP_TABLES) await db[t].clear();
  });
  const { seedIfEmpty } = await import('./seed');
  await seedIfEmpty();
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
