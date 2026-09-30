import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { getSettings, saveSettings, resetSettings } from '../../db/settings';
import { resetToSeed } from '../../db/backup';
import { confirmDialog, toast } from '../../lib/dialogs';
import ProfileSection from './ProfileSection';
import TermsSection from './TermsSection';
import PrefsSection from './PrefsSection';
import BackupSection from './BackupSection';
import StorageSection from './StorageSection';
import AboutSection from './AboutSection';

export default function SettingsScreen() {
  // Stored values stay live (backup import, reset, other tabs…); edits are
  // kept in a small draft of just the fields the teacher touched, and only
  // those are written on save — so we never overwrite unrelated keys such as
  // the last-backup timestamp or the per-subject "current standard" pointers.
  const stored = useLiveQuery(getSettings, []);
  const [draft, setDraft] = useState({});
  const settings = stored ? { ...stored, ...draft } : null;
  const dirty = Object.keys(draft).length > 0;

  const update = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const save = async () => {
    await saveSettings(draft);
    setDraft({});
    toast.success('Settings saved.');
  };

  if (!settings) return <div className="p-6 text-slate-500">Loading…</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-sm text-slate-600 hover:text-slate-900 font-medium">
            ← Now
          </Link>
          <h1 className="text-lg font-bold">Settings & Backup</h1>
          <button
            onClick={save}
            disabled={!dirty}
            className="text-sm px-3 py-1.5 rounded-lg bg-primary text-on-primary disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-4 space-y-4">
        <ProfileSection settings={settings} onChange={update} />

        <TermsSection
          terms={settings.terms}
          onChange={(terms) => update({ terms })}
        />

        <PrefsSection
          prefs={settings.prefs}
          onChange={(prefs) => update({ prefs })}
        />

        <BackupSection onImported={() => setDraft({})} />

        <StorageSection />

        <AboutSection
          onReset={async () => {
            const ok = await confirmDialog({
              title: 'Reset all app data?',
              message: 'Curriculum, timetable, lessons and settings will be replaced by the demo data.',
              confirmLabel: 'Reset everything',
              danger: true,
            });
            if (!ok) return;
            await resetSettings();
            await resetToSeed();
            setDraft({});
            toast.success('Reset complete.');
          }}
        />
      </main>

      {dirty && (
        <div className="fixed bottom-20 inset-x-0 flex justify-center print:hidden z-30">
          <div className="bg-slate-900 text-white text-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-3">
            <span>Unsaved changes</span>
            <button onClick={save} className="underline text-xs font-medium">
              Save now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
