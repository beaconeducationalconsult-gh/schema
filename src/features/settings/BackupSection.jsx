import React, { useRef, useState } from 'react';
import {
  exportBackup,
  serializeBackup,
  importBackup,
  markExported,
} from '../../db/backup';
import { toast, confirmDialog } from '../../lib/dialogs';
import { downloadFile } from '../../db/history';
import { toDateKey } from '../../db/helpers';

export default function BackupSection({ onImported }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [lastMsg, setLastMsg] = useState(null);

  const doExport = async () => {
    setBusy(true);
    try {
      const snap = await exportBackup();
      const text = serializeBackup(snap);
      const name = `teaching-companion-${toDateKey(new Date())}.json`;
      downloadFile(name, text, 'application/json');
      await markExported();
      setLastMsg({
        tone: 'ok',
        text: `Exported ${Object.values(snap.meta.counts).reduce((a, b) => a + b, 0)} rows.`,
      });
    } catch (e) {
      setLastMsg({ tone: 'err', text: e.message });
    } finally {
      setBusy(false);
    }
  };

  const doImport = async (mode) => {
    const file = fileRef.current?.files?.[0];
    if (!file) return toast.error('Choose a backup .json file first.');
    if (mode === 'replace') {
      const ok = await confirmDialog({
        title: 'Replace all current data?',
        message: 'Everything on this device will be overwritten by the backup. This cannot be undone.',
        confirmLabel: 'Replace everything',
        danger: true,
      });
      if (!ok) return;
    }
    setBusy(true);
    try {
      const text = await file.text();
      const obj = JSON.parse(text);
      const result = await importBackup(obj, { mode });
      setLastMsg({
        tone: 'ok',
        text: `Imported (${mode}): ${Object.entries(result.imported)
          .map(([t, n]) => `${t}:${n}`)
          .join(' · ')}`,
      });
      onImported?.();
    } catch (e) {
      setLastMsg({ tone: 'err', text: e.message });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-1">
        💾 Backup & Restore
      </h2>
      <p className="text-xs text-slate-500 mb-4">
        Your data lives only on this device. Export a backup regularly — it's a
        single JSON file you can email to yourself or keep in cloud storage.
      </p>

      <button
        onClick={doExport}
        disabled={busy}
        className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium disabled:opacity-40 mb-3"
      >
        ⬇ Export backup (.json)
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 mb-3"
      />

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => doImport('merge')}
          disabled={busy}
          className="py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm hover:bg-slate-50 disabled:opacity-40"
        >
          Merge into current
        </button>
        <button
          onClick={() => doImport('replace')}
          disabled={busy}
          className="py-2.5 rounded-xl border border-rose-300 text-rose-700 text-sm hover:bg-rose-50 disabled:opacity-40"
        >
          Replace everything
        </button>
      </div>

      {lastMsg && (
        <div
          className={`mt-3 text-xs rounded-lg px-3 py-2 ${
            lastMsg.tone === 'ok'
              ? 'bg-emerald-50 text-emerald-800'
              : 'bg-rose-50 text-rose-800'
          }`}
        >
          {lastMsg.text}
        </div>
      )}
    </section>
  );
}
