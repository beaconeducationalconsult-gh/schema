import React from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { getSettings, saveSettings, resetSettings } from '../../db/settings';
import { resetToSeed } from '../../db/backup';
import { confirmDialog, toast } from '../../lib/dialogs';
import ProfileSection from './ProfileSection';
import TermsSection from './TermsSection';
import DisplaySection from './DisplaySection';
import PrefsSection from './PrefsSection';
import BackupSection from './BackupSection';
import StorageSection from './StorageSection';
import AboutSection from './AboutSection';

export default function SettingsScreen() {
  const settings = useLiveQuery(getSettings, []);
  if (!settings) return <div className="p-6 text-slate-500">Loading…</div>;

  const autoSave = (patch) => {
    saveSettings(patch);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="bg-surface border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-sm text-slate-600 hover:text-slate-900 font-medium">
            ← Now
          </Link>
          <h1 className="text-lg font-bold">Settings & Backup</h1>
          <span className="text-xs text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Auto-saved ✓
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-4 space-y-4">
        <div className="text-xs text-slate-500 text-center -mt-1">
          Changes save automatically — no Save button needed
        </div>
        <ProfileSection settings={settings} onChange={autoSave} />

        <TermsSection terms={settings.terms} onChange={(terms) => autoSave({ terms })} />

        <DisplaySection />

        <PrefsSection prefs={settings.prefs} onChange={(prefs) => autoSave({ prefs })} />

        <BackupSection onImported={() => {}} />

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
            toast.success('Reset complete.');
          }}
        />
      </main>
    </div>
  );
}
