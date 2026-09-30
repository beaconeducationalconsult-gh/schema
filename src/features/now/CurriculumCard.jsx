import React from 'react';
import { Link } from 'react-router-dom';
import ResourceGallery from '../../components/ResourceGallery';

export default function CurriculumCard({
  strand,
  subStrand,
  standard,
  allStandards,
  resources,
  onSwitchStandard,
  onManageMedia,
}) {
  return (
    <section className="max-w-3xl mx-auto px-4 pt-3">
      <div className="bg-surface rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <span>📚 What I'm Teaching</span>
          </div>

          {allStandards?.length > 1 && (
            <select
              aria-label="Switch curriculum standard"
              value={standard.id}
              onChange={(e) => onSwitchStandard(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 text-slate-700 bg-slate-50 max-w-[220px] truncate"
            >
              {allStandards.map(s => (
                <option key={s.id} value={s.id}>
                  {s._subStrandName}: {(s.indicator || s.contentStandard).slice(0, 45)}…
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
          <Meta label="Strand" value={strand?.name} />
          <Meta label="Sub-strand" value={subStrand?.name} />
        </div>

        <div className="mb-3">
          <Meta label="Content Standard" value={standard.contentStandard} block />
        </div>
        <div className="mb-3">
          <Meta label="Indicator" value={standard.indicator} block highlight />
        </div>

        {standard.exemplars?.length > 0 && (
          <div className="pt-2 border-t border-slate-100 mb-3">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Exemplars
            </div>
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
          <ResourceGallery
            resources={resources}
            onManage={onManageMedia}
            compact
          />
        </div>
      </div>
    </section>
  );
}

function Meta({ label, value, block, highlight }) {
  if (!value) return null;
  return (
    <div className={block ? '' : 'min-w-0'}>
      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
        {label}
      </div>
      <div
        className={`text-sm leading-snug mt-0.5 ${
          highlight ? 'text-slate-900 font-medium' : 'text-slate-800'
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export function NoStandardCard({ subject }) {
  return (
    <section className="max-w-3xl mx-auto px-4 pt-3">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800 flex items-center justify-between">
        <div>
          No curriculum standard linked to <b>{subject?.name}</b> yet.
        </div>
        <Link
          to="/curriculum"
          className="px-3 py-1.5 rounded-lg bg-amber-800 text-white text-xs font-medium shrink-0"
        >
          Open Curriculum
        </Link>
      </div>
    </section>
  );
}
