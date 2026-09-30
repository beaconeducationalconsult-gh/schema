import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { loadWeek, ensureLessonFor } from '../../db/schedule';
import {
  startOfWeek,
  addWeeks,
  formatWeekRange,
  isSameWeek,
} from '../../lib/week';
import { toDateKey, subjects as subjectRepo } from '../../db/helpers';
import WeekGrid from './WeekGrid';
import DayList from './DayList';
import SlotEditor from './SlotEditor';

const EMPTY = [];
const STORAGE_KEY = 'week:includeWeekend';

export default function WeekScreen() {
  const [search, setSearch] = useSearchParams();
  const navigate = useNavigate();

  const initial = (() => {
    const param = search.get('week');
    return param ? startOfWeek(new Date(param + 'T00:00:00')) : startOfWeek(new Date());
  })();

  const [weekStart, setWeekStart] = useState(initial);
  const [includeWeekend, setIncludeWeekend] = useState(
    () => localStorage.getItem(STORAGE_KEY) === '1'
  );
  const [view, setView] = useState(() => {
    return window.matchMedia('(min-width: 768px)').matches ? 'grid' : 'list';
  });
  const [todayKey, setTodayKey] = useState(toDateKey(new Date()));
  const [editMode, setEditMode] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setTodayKey(toDateKey(new Date())), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, includeWeekend ? '1' : '0');
  }, [includeWeekend]);

  useEffect(() => {
    setSearch({ week: toDateKey(weekStart) }, { replace: true });
  }, [weekStart]);

  // Live: editing a slot, completing a lesson or restoring a backup refreshes the grid.
  const weekKey = toDateKey(weekStart);
  const data = useLiveQuery(
    () => loadWeek(weekStart, { includeWeekend }),
    [weekKey, includeWeekend]
  );
  const subjectsList = useLiveQuery(() => subjectRepo.all(), [], EMPTY);
  const loading = data === undefined;

  const isThisWeek = isSameWeek(weekStart, new Date());

  const openSlot = async (slot, date) => {
    if (editMode) {
      setEditingSlot(slot);
      return;
    }
    const lesson = await ensureLessonFor(slot, date);
    navigate(`/lesson/${lesson.id}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="bg-surface border-b border-slate-200 sticky top-0 z-10 print:static print:border-0">
        <div className="max-w-5xl mx-auto px-4 py-3">
          {/* Row 1: nav */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Link to="/" className="text-sm text-slate-600 hover:text-slate-900 font-medium print:hidden">
              ← Now
            </Link>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setWeekStart(w => addWeeks(w, -1))}
                className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 print:hidden"
              >
                ◀
              </button>
              <div className="px-3 text-center min-w-[180px]">
                <div className="text-sm font-semibold text-slate-900">
                  {formatWeekRange(weekStart, { includeWeekend })}
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                  {isThisWeek ? 'This week' : 'Week'}
                </div>
              </div>
              <button
                onClick={() => setWeekStart(w => addWeeks(w, 1))}
                className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 print:hidden"
              >
                ▶
              </button>
            </div>

            <div className="flex gap-1.5 print:hidden">
              <button
                onClick={() => setWeekStart(startOfWeek(new Date()))}
                disabled={isThisWeek}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40"
              >
                Today
              </button>
              <button
                onClick={() => window.print()}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200"
              >
                Print
              </button>
              <button
                onClick={() => setEditingSlot({ isNew: true })}
                className="text-xs px-3 py-1.5 rounded-lg bg-primary text-on-primary font-medium"
              >
                + Add Slot
              </button>
            </div>
          </div>

          {/* Row 2: toggles */}
          <div className="flex items-center justify-between gap-2 mt-3 print:hidden flex-wrap">
            <div className="flex items-center gap-2">
              <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
                <Tab active={view === 'grid'} onClick={() => setView('grid')}>
                  Grid
                </Tab>
                <Tab active={view === 'list'} onClick={() => setView('list')}>
                  List
                </Tab>
              </div>

              <button
                onClick={() => setEditMode(m => !m)}
                className={`text-xs px-3 py-1 rounded-lg border transition ${
                  editMode
                    ? 'bg-amber-100 border-amber-300 text-amber-900 font-medium'
                    : 'bg-surface border-slate-200 text-slate-600'
                }`}
              >
                {editMode ? '✓ Done Editing Slots' : '✎ Edit Slots'}
              </button>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={includeWeekend}
                onChange={(e) => setIncludeWeekend(e.target.checked)}
              />
              Include weekend
            </label>
          </div>

          {editMode && (
            <div className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
              Tap any timetable slot below to edit its time, subject, room, or delete it.
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-4">
        {loading || !data ? (
          <Skeleton view={view} />
        ) : view === 'grid' ? (
          <WeekGrid
            data={data}
            todayKey={todayKey}
            editMode={editMode}
            onOpenSlot={openSlot}
          />
        ) : (
          <DayList
            data={data}
            todayKey={todayKey}
            editMode={editMode}
            onOpenSlot={openSlot}
          />
        )}
      </main>

      {editingSlot && (
        <SlotEditor
          slot={editingSlot.isNew ? null : editingSlot}
          subjects={subjectsList}
          onClose={() => setEditingSlot(null)}
          onSaved={() => {
            setEditingSlot(null);
          }}
        />
      )}
    </div>
  );
}

function Tab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs rounded-md font-medium ${
        active ? 'bg-surface shadow text-slate-900' : 'text-slate-500'
      }`}
    >
      {children}
    </button>
  );
}

function Skeleton({ view }) {
  return (
    <div className="animate-pulse space-y-3">
      {view === 'grid' ? (
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-64 bg-surface rounded-xl" />
          ))}
        </div>
      ) : (
        Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 bg-surface rounded-xl" />
        ))
      )}
    </div>
  );
}
