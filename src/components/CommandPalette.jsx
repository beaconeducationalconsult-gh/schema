import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { Search, Timer, CalendarDays, BookOpen, NotebookPen, History, Settings } from 'lucide-react';

const COMMANDS = [
  { id: 'today', label: 'Go to Today', desc: 'What am I teaching now', Icon: Timer, to: '/' },
  { id: 'timetable', label: 'Go to Timetable', desc: 'Weekly timetable', Icon: CalendarDays, to: '/schedule' },
  { id: 'library', label: 'Go to Library — Standards', desc: 'Curriculum catalogue', Icon: BookOpen, to: '/curriculum' },
  { id: 'notes', label: 'Go to Notes', desc: 'All teaching notes', Icon: NotebookPen, to: '/notes' },
  { id: 'history', label: 'Go to History', desc: 'Past lessons', Icon: History, to: '/history' },
  { id: 'settings', label: 'Go to Settings', desc: 'Profile, prefs, backup', Icon: Settings, to: '/settings' },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  // Load standards for search — lightweight
  const standards = useLiveQuery(async () => {
    const all = await db.standards.toArray();
    const enriched = [];
    for (const s of all.slice(0, 200)) {
      const sub = s.subStrandId ? await db.subStrands.get(s.subStrandId) : null;
      const strand = sub ? await db.strands.get(sub.strandId) : null;
      const subject = strand ? await db.subjects.get(strand.subjectId) : null;
      enriched.push({
        id: s.id,
        contentStandard: s.contentStandard,
        indicator: s.indicator,
        subjectName: subject?.name || 'Subject',
        strandName: strand?.name || '',
        subStrandName: sub?.name || '',
      });
    }
    return enriched;
  }, [], []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape' && open) setOpen(false);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('tc-open-palette', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('tc-open-palette', onOpen);
    };
  }, [open]);

  const filteredCommands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter((c) => c.label.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q));
  }, [query]);

  const filteredStandards = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !standards || q.length < 2) return [];
    return standards
      .filter(
        (s) =>
          (s.indicator || '').toLowerCase().includes(q) ||
          (s.contentStandard || '').toLowerCase().includes(q) ||
          (s.subjectName || '').toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [standards, query]);

  if (!open) return null;

  const go = (to) => {
    setOpen(false);
    setQuery('');
    navigate(to);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[10vh] p-4" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative bg-surface w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
          <Search size={16} className="text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search standards, or jump to… (try 'fractions' or 'timetable')"
            className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-slate-400"
          />
          <span className="hidden sm:inline text-xs text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">ESC</span>
          <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">
            ✕
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {filteredStandards.length > 0 && (
            <div className="mb-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-2 py-1">Standards</div>
              {filteredStandards.map((s) => (
                <button
                  key={s.id}
                  onClick={() => go('/curriculum')}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 flex items-start gap-3"
                >
                  <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <BookOpen size={14} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500">{s.subjectName} · {s.strandName} › {s.subStrandName}</div>
                    <div className="text-sm font-medium text-slate-800 truncate">{s.indicator || s.contentStandard}</div>
                    <div className="text-xs text-slate-500 truncate">{s.contentStandard?.slice(0, 80)}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-2 py-1">
              {filteredStandards.length > 0 ? 'Jump to' : 'Quick actions'}
            </div>
            {filteredCommands.map((c) => (
              <button
                key={c.id}
                onClick={() => go(c.to)}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 flex items-center gap-3"
              >
                <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <c.Icon size={14} className="text-slate-600" />
                </span>
                <div>
                  <div className="text-sm font-medium text-slate-800">{c.label}</div>
                  <div className="text-xs text-slate-500">{c.desc}</div>
                </div>
              </button>
            ))}
            {filteredCommands.length === 0 && filteredStandards.length === 0 && (
              <div className="text-sm text-slate-500 text-center py-6">No results for “{query}”</div>
            )}
          </div>

          <div className="px-2 py-2 text-xs text-slate-400 border-t border-slate-100 mt-2">
            <span className="hidden sm:inline">Tip: Press </span>
            <span className="font-mono bg-slate-100 px-1 rounded">⌘K</span> <span className="hidden sm:inline"> or </span>
            <span className="font-mono bg-slate-100 px-1 rounded">Ctrl+K</span>
            <span className="hidden sm:inline"> to open • </span>
            <span className="sm:hidden">to open</span>
          </div>
        </div>
      </div>
    </div>
  );
}
