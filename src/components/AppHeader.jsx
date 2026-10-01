import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Settings, GraduationCap } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getSettings } from '../db/settings';

export default function AppHeader() {
  const location = useLocation();
  const settings = useLiveQuery(getSettings, [], null);

  // Hide during onboarding (handled in App.jsx before this mounts) and guided mode
  const params = new URLSearchParams(location.search);
  if (location.pathname.startsWith('/lesson/') && params.get('guided') === '1') return null;
  if (location.pathname === '/') {
    // On Today, the StatusBanner is the hero — header would duplicate. Keep header minimal only on other tabs?
    // For Phase 1 we show header on every tab except Today to avoid double hero.
    // But to keep consistent thumb zone, we keep it everywhere except Today.
    // Uncomment below to hide on Today:
    // return null;
  }

  const school = settings?.schoolName || 'Teaching Companion';
  const klass = settings?.classLevel;
  const teacher = settings?.teacherName;

  return (
    <header className="bg-surface border-b border-slate-200 print:hidden">
      <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0">
            <GraduationCap size={16} />
          </div>
          <div className="min-w-0 hidden sm:block">
            <div className="text-xs font-semibold text-slate-900 leading-none truncate">
              {school}
              {klass ? ` · ${klass}` : ''}
            </div>
            {teacher && <div className="text-[11px] text-slate-500 leading-none truncate">{teacher}</div>}
          </div>
          <div className="min-w-0 sm:hidden">
            <div className="text-xs font-semibold text-slate-900 leading-none truncate">
              {klass || school}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('tc-open-palette'))}
            aria-label="Search"
            className="w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600"
            title="Search (⌘K)"
          >
            <Search size={16} />
          </button>
          <Link
            to="/settings"
            aria-label="Settings"
            className="w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600"
            title="Settings"
          >
            <Settings size={16} />
          </Link>
        </div>
      </div>
    </header>
  );
}
