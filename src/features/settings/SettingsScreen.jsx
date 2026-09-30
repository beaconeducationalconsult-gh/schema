import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSettings, saveSettings, resetSettings } from '../../db/settings';
import ProfileSection from './ProfileSection';
import TermsSection from './TermsSection';
import PrefsSection from './PrefsSection';
import BackupSection from './BackupSection';
import StorageSection from './StorageSection';
import AboutSection from './AboutSection';

export default function SettingsScreen() {
  const [settings, setSettings] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [storageKey, setStorageKey] = useState(0);

  const reload = async () => {
    setSettings(await getSettings());
    setStorageKey(k => k + 1);
  };
  useEffect(() => { reload(); }, []);

  const update = (patch) => {
    setSettings(s => ({ ...s, ...patch }));
    setDirty(true);
  };

  const save = async () => {
    const { terms, prefs, currentStandardBySubject, ...scalar } = settings;
    await saveSettings({ ...scalar, terms, prefs, currentStandardBySubject });
    setDirty(false);
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
            className="text-sm px-3 py-1.5 rounded-lg bg-slate-900 text-white disabled:opacity-40"
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

        <BackupSection onImported={reload} />

        <StorageSection key={storageKey} />

        <AboutSection
          onReset={async () => {
            if (
              !confirm(
                'Reset ALL app data (curriculum, timetable, lessons, settings) to the demo seed?'
              )
            )
              return;
            await resetSettings();
            const { resetToSeed } = await import('../../db/backup');
            await resetToSeed();
            await reload();
            alert('Reset complete.');
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
