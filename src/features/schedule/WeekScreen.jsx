import React, { useEffect, useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { loadWeek, ensureLessonFor } from '../../db/schedule';
import { savePrefs } from '../../db/settings';
import { usePrefs } from '../../hooks/usePrefs';
import {
  startOfWeek,
  addWeeks,
  formatWeekRange,
  isSameWeek,
} from '../../lib/week';
import { toDateKey, subjects as subjectRepo } from '../../db/helpers';
import { queryLessons } from '../../db/history';
import WeekGrid from './WeekGrid';
import DayList from './DayList';
import SlotEditor from './SlotEditor';
import LessonRow from '../history/LessonRow';

const EMPTY = [];

export default function WeekScreen() {
  const [search, setSearch] = useSearchParams();
  const navigate = useNavigate();

  // \"Show weekends\" and \"Week starts on\" come from Settings → Preferences (live).
  const prefs = usePrefs();
  const includeWeekend = prefs?.includeWeekend ?? false;
  const weekStartsOn = prefs?.weekStartsOn ?? 1;

  const [anchor, setAnchor] = useState(() => {
    const param = search.get('week');
    return param ? new Date(param + 'T00:00:00') : new Date();
  });
  const anchorKey = toDateKey(anchor);
  const weekStart = startOfWeek(anchor, weekStartsOn);
  const weekKey = toDateKey(weekStart);
  const [view, setView] = useState(() => {
    return window.matchMedia('(min-width: 768px)').matches ? 'grid' : 'list';
  });
  const [now, setNow] = useState(() => new Date());
  const todayKey = toDateKey(now);
  const [editingSlot, setEditingSlot] = useState(null);
  const [planTab, setPlanTab] = useState('timetable'); // 'timetable' | 'lessons'

  useEffect(() => {
    const h = () => setEditingSlot({ isNew: true });
    window.addEventListener('tc-open-add-slot', h);
    return () => window.removeEventListener('tc-open-add-slot', h);
  }, []);
  const [lessonSearch, setLessonSearch] = useState('');

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (search.get('week') !== anchorKey) setSearch({ week: anchorKey }, { replace: true });
  }, [anchorKey, search, setSearch]);

  const data = useLiveQuery(
    () => (prefs ? loadWeek(weekStart, { includeWeekend, weekStartsOn }) : undefined),
    [weekKey, includeWeekend, weekStartsOn, !!prefs]
  );
  const subjectsList = useLiveQuery(() => subjectRepo.all(), [], EMPTY);
  const loading = data === undefined;

  const isThisWeek = isSameWeek(weekStart, now, weekStartsOn);

  const openSlot = async (slot, date) => {
    const lesson = await ensureLessonFor(slot, date);
    navigate(`/lesson/${lesson.id}`);
  };

  // Lessons for this week — for the Lessons tab
  const weekRange = useMemo(() => {
    if (!data?.days?.length) return null;
    return {
      from: toDateKey(data.days[0]),
      to: toDateKey(data.days[data.days.length - 1]),
    };
  }, [data]);

  const weekLessons = useLiveQuery(
    () =>
      weekRange
        ? queryLessons({
            from: weekRange.from,
            to: weekRange.to,
            search: lessonSearch,
            sort: 'asc',
          })
        : undefined,
    [weekRange?.from, weekRange?.to, lessonSearch]
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="bg-surface border-b border-slate-200 sticky top-0 z-10 print:static print:border-0">
        <div className="max-w-5xl mx-auto px-4 py-3">
          {/* Row 1: week nav */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Link to="/" className="text-sm text-slate-600 hover:text-slate-900 font-medium print:hidden">
              ← Now
            </Link>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setAnchor((a) => addWeeks(a, -1))}
                className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 print:hidden"
                aria-label="Previous week"
              >
                ◀
              </button>
              <div className="px-3 text-center min-w-[180px]">
                <div className="text-sm font-semibold text-slate-900">
                  {formatWeekRange(weekStart, { includeWeekend, weekStartsOn })}
                </div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">
                  {isThisWeek ? 'This week' : 'Week'}
                </div>
              </div>
              <button
                onClick={() => setAnchor((a) => addWeeks(a, 1))}
                className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 print:hidden"
                aria-label="Next week"
              >
                ▶
              </button>
            </div>

            <div className="flex gap-1.5 print:hidden">
              <button
                onClick={() => setAnchor(new Date())}
                disabled={isThisWeek}
                className="text-xs px-3 py-2 rounded-xl border border-slate-200 disabled:opacity-40 min-h-[36px]"
              >
                Today
              </button>
              <button
                onClick={() => window.print()}
                className="text-xs px-3 py-2 rounded-xl border border-slate-200 min-h-[36px]"
                title="Print"
              >
                Print
              </button>
              {planTab === 'timetable' && (
                <button
                  onClick={() => setEditingSlot({ isNew: true })}
                  className="text-xs px-3 py-2 rounded-xl bg-primary text-on-primary font-medium min-h-[36px]"
                >
                  + Add Slot
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Plan tabs — Timetable | Lessons */}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setPlanTab('timetable')}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium min-h-[32px] transition ${
                  planTab === 'timetable' ? 'bg-surface shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Timetable
              </button>
              <button
                onClick={() => setPlanTab('lessons')}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium min-h-[32px] transition flex items-center gap-1.5 ${
                  planTab === 'lessons' ? 'bg-surface shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Lessons
                {weekLessons && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${planTab === 'lessons' ? 'bg-primary text-on-primary' : 'bg-slate-200 text-slate-600'}`}>
                    {weekLessons.length}
                  </span>
                )}
              </button>
            </div>
            {planTab === 'timetable' && (
              <div className="ml-auto flex items-center gap-2">
                <div className="hidden sm:flex gap-1 bg-slate-100 rounded-lg p-0.5">
                  <Tab active={view === 'grid'} onClick={() => setView('grid')}>
                    Grid
                  </Tab>
                  <Tab active={view === 'list'} onClick={() => setView('list')}>
                    List
                  </Tab>
                </div>
                <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer ml-1">
                  <input
                    type="checkbox"
                    checked={includeWeekend}
                    onChange={(e) => savePrefs({ includeWeekend: e.target.checked })}
                  />
                  Include weekend
                </label>
              </div>
            )}
            {planTab === 'lessons' && weekRange && (
              <div className="ml-auto text-xs text-slate-500 hidden sm:block">
                {weekRange.from} → {weekRange.to}
              </div>
            )}
          </div>

          {/* Row 3: mobile view toggle + search for lessons tab */}
          {planTab === 'timetable' && (
            <div className="flex sm:hidden mt-2 gap-1 bg-slate-100 rounded-lg p-0.5 w-fit">
              <Tab active={view === 'grid'} onClick={() => setView('grid')}>
                Grid
              </Tab>
              <Tab active={view === 'list'} onClick={() => setView('list')}>
                List
              </Tab>
            </div>
          )}
          {planTab === 'lessons' && (
            <div className="mt-3 flex gap-2">
              <input
                value={lessonSearch}
                onChange={(e) => setLessonSearch(e.target.value)}
                placeholder="Search lessons this week…"
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
              {lessonSearch && (
                <button
                  onClick={() => setLessonSearch('')}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-4">
        {planTab === 'timetable' ? (
          loading || !data ? (
            <Skeleton view={view} />
          ) : view === 'grid' ? (
            <WeekGrid data={data} now={now} todayKey={todayKey} onOpenSlot={openSlot} onEditSlot={setEditingSlot} />
          ) : (
            <DayList data={data} now={now} todayKey={todayKey} onOpenSlot={openSlot} onEditSlot={setEditingSlot} />
          )
        ) : (
          <LessonsTabContent rows={weekLessons} />
        )}
      </main>

      {editingSlot && (
        <SlotEditor
          slot={editingSlot.isNew ? null : editingSlot}
          subjects={subjectsList}
          onClose={() => setEditingSlot(null)}
          onSaved={() => setEditingSlot(null)}
        />
      )}
    </div>
  );
}

function LessonsTabContent({ rows }) {
  if (rows === undefined) {
    return (
      <div className="space-y-2 animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-surface rounded-2xl" />
        ))}
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="bg-surface rounded-2xl border border-slate-200 p-8 text-center">
        <div className="text-3xl mb-2">📝</div>
        <div className="text-sm font-medium text-slate-700">No lessons this week</div>
        <div className="text-xs text-slate-500 mt-1">Tap a timetable slot to create a lesson plan.</div>
        <Link to="/history" className="inline-block mt-3 text-xs text-blue-600 font-medium hover:underline">
          View all history →
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="text-xs text-slate-500 px-1">
        {rows.length} lesson{rows.length === 1 ? '' : 's'} this week
      </div>
      {rows.map((r) => (
        <LessonRow key={r.lesson.id} row={r} />
      ))}
      <div className="pt-2 text-center">
        <Link to="/history" className="text-xs text-slate-600 hover:text-slate-900 font-medium px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 inline-block">
          View full history →
        </Link>
      </div>
    </div>
  );
}

function Tab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs rounded-md font-medium min-h-[28px] transition ${active ? 'bg-surface shadow text-slate-900' : 'text-slate-500'}`}
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
