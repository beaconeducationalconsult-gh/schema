import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { subjects as subjectRepo, toDateKey } from '../../db/helpers';
import { queryLessons, computeStats, toCSV, downloadFile } from '../../db/history';
import LessonRow from './LessonRow';
import StatsBar from './StatsBar';
import Filters from './Filters';

export default function HistoryScreen() {
  const [subjects, setSubjects] = useState([]);
  const [filters, setFilters] = useState({
    range: 'month',
    from: '',
    to: '',
    subjectId: null,
    status: null,
    search: '',
    sort: 'desc',
  });
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { subjectRepo.all().then(setSubjects); }, []);

  const { from, to } = useMemo(
    () => resolveRange(filters),
    [filters.range, filters.from, filters.to]
  );

  useEffect(() => {
    let alive = true;
    setLoading(true);
    queryLessons({
      from,
      to,
      subjectId: filters.subjectId,
      status: filters.status,
      search: filters.search,
      sort: filters.sort,
    }).then(r => {
      if (!alive) return;
      setRows(r);
      setStats(computeStats(r));
      setLoading(false);
    });
    return () => { alive = false; };
  }, [from, to, filters.subjectId, filters.status, filters.search, filters.sort]);

  const exportCSV = () => {
    const csv = toCSV(rows);
    downloadFile(`lessons-${toDateKey(new Date())}.csv`, csv);
  };

  const exportJSON = () => {
    const json = JSON.stringify(
      rows.map(r => ({
        lesson: r.lesson,
        slot: r.slot,
        subject: r.subject ? { id: r.subject.id, name: r.subject.name } : null,
        standard: r.standard,
        activities: r.activities,
        notes: r.notes,
      })),
      null,
      2
    );
    downloadFile(`lessons-${toDateKey(new Date())}.json`, json, 'application/json');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-sm text-slate-600 hover:text-slate-900 font-medium">
            ← Now
          </Link>
          <h1 className="text-lg font-bold">Lesson History</h1>
          <div className="flex gap-1.5">
            <button
              onClick={exportCSV}
              disabled={rows.length === 0}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              CSV
            </button>
            <button
              onClick={exportJSON}
              disabled={rows.length === 0}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              JSON
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-4 space-y-4">
        <Filters filters={filters} setFilters={setFilters} subjects={subjects} />

        {stats && <StatsBar stats={stats} />}

        <section>
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-white rounded-2xl" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="space-y-2">
              {rows.map(r => <LessonRow key={r.lesson.id} row={r} />)}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function resolveRange(filters) {
  const today = new Date();
  if (filters.range === 'all') return { from: null, to: null };

  if (filters.range === 'week') {
    const d = new Date(today);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    const end = new Date(d);
    end.setDate(end.getDate() + 6);
    return { from: toDateKey(d), to: toDateKey(end) };
  }

  if (filters.range === 'month') {
    const d = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { from: toDateKey(d), to: toDateKey(end) };
  }

  if (filters.range === 'term') {
    const y = today.getFullYear();
    const m = today.getMonth();
    let from, to;
    if (m >= 8)       { from = new Date(y, 8, 1);  to = new Date(y, 11, 31); }
    else if (m >= 4)  { from = new Date(y, 4, 1);  to = new Date(y, 7, 31); }
    else              { from = new Date(y, 0, 1);  to = new Date(y, 3, 30); }
    return { from: toDateKey(from), to: toDateKey(to) };
  }

  if (filters.range === 'custom') {
    return { from: filters.from || null, to: filters.to || null };
  }

  return { from: null, to: null };
}

function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
      <div className="text-4xl mb-2">📭</div>
      <h3 className="font-semibold text-slate-800">No lessons match</h3>
      <p className="text-sm text-slate-500 mt-1">
        Try widening the range or clearing filters.
      </p>
    </div>
  );
}
