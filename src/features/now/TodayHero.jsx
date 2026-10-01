import React from 'react';
import { Link } from 'react-router-dom';
import { DAY_NAMES } from '../../lib/dayNames';
import ResourceGallery from '../../components/ResourceGallery';

export default function TodayHero({
  slot,
  subject,
  lesson,
  strand,
  subStrand,
  standard,
  resources = [],
  allStandards = [],
  onSwitchStandard,
  onManageMedia,
  isPreviewMode,
}) {
  const hasStandard = !!standard;

  return (
    <section className="max-w-3xl mx-auto px-4 pt-4">
      <div className="bg-surface rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Class header */}
        <div className="p-5">
          <div className="flex items-start gap-3">
            <span
              className="w-1.5 h-12 rounded-full shrink-0 mt-1"
              style={{ backgroundColor: subject?.color || '#475569' }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {slot.classLevel}
                </span>
                {isPreviewMode && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                    {DAY_NAMES[slot.dayOfWeek]} preview
                  </span>
                )}
                {lesson?.status === 'done' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold uppercase">
                    Completed
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight truncate">
                {subject?.name || 'Unknown subject'}
              </h1>
              <div className="text-sm text-slate-600 mt-1">
                {slot.startTime} – {slot.endTime}
                {slot.room && (
                  <>
                    {' '}
                    · <span className="font-medium">{slot.room}</span>
                  </>
                )}
              </div>
              {hasStandard && (strand || subStrand) && (
                <div className="text-xs text-slate-500 mt-1 truncate">
                  {strand?.name}
                  {strand && subStrand ? ' › ' : ''}
                  {subStrand?.name}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Standard */}
        {hasStandard ? (
          <div className="px-5 pb-4 space-y-3">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MiniMeta label="Strand" value={strand?.name} />
              <MiniMeta label="Sub-strand" value={subStrand?.name} />
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Content Standard</div>
              <div className="text-sm font-medium text-slate-800 leading-snug mt-1">{standard.contentStandard}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Indicator</div>
              <div className="text-sm text-slate-900 font-medium leading-snug mt-1">{standard.indicator}</div>
            </div>

            {standard.exemplars?.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Exemplars</div>
                <ul className="space-y-1.5">
                  {standard.exemplars.map((e, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700">
                      <span className="text-blue-500 font-bold">•</span>
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100">
              <ResourceGallery resources={resources} onManage={onManageMedia} compact />
            </div>

            {allStandards?.length > 1 && (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500">Switch standard:</span>
                <select
                  value={standard.id}
                  onChange={(e) => onSwitchStandard?.(e.target.value)}
                  className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 text-slate-700 truncate"
                >
                  {allStandards.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s._subStrandName || s.indicator?.slice(0, 30)}: {(s.indicator || s.contentStandard).slice(0, 45)}…
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ) : (
          <div className="px-5 pb-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="text-sm text-amber-800">
                No curriculum standard linked to <b>{subject?.name}</b> yet.
              </div>
              <Link to="/curriculum" className="px-3 py-1.5 rounded-lg bg-amber-800 text-white text-xs font-medium shrink-0">
                Open Curriculum
              </Link>
            </div>
          </div>
        )}

        {/* Primary actions — single place, no duplicates */}
        {lesson && (
          <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex gap-2">
            <Link
              to={`/lesson/${lesson.id}?guided=1`}
              className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm text-center shadow-sm"
            >
              ▶ Teach Now
            </Link>
            <Link
              to={`/lesson/${lesson.id}`}
              className="flex-1 py-3 rounded-xl bg-surface border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm text-center"
            >
              View plan
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function MiniMeta({ label, value }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</div>
      <div className="text-xs font-medium text-slate-700 truncate mt-0.5">{value}</div>
    </div>
  );
}
