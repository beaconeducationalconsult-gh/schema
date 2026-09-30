import React from 'react';

export default function AboutSection({ onReset }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
        ℹ️ About
      </h2>

      <div className="text-xs text-slate-600 space-y-1">
        <div>Teaching Companion · Local-first NaCCA Curriculum PWA</div>
        <div>Data is stored only on this device (IndexedDB via Dexie).</div>
        <div>Offline by default. Export backups regularly.</div>
      </div>

      <button
        onClick={onReset}
        className="mt-4 w-full py-2.5 rounded-xl border border-rose-300 text-rose-700 text-sm hover:bg-rose-50"
      >
        Reset app to demo data
      </button>
      <p className="text-[10px] text-slate-400 mt-1 text-center">
        Erases every subject, lesson, note, and setting. Export first.
      </p>
    </section>
  );
}
