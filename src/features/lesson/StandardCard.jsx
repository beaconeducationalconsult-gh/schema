import React from 'react';
import ResourceGallery from '../../components/ResourceGallery';

export default function StandardCard({
  strand,
  subStrand,
  standard,
  resources,
  allStandards,
  currentId,
  onChange,
  onEditStandard,
  onManageMedia,
}) {
  return (
    <div className="bg-surface rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3 print:hidden">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          📚 Curriculum Standard
        </span>
        <div className="flex gap-2 items-center">
          <select
            value={currentId}
            onChange={(e) => onChange(Number(e.target.value))}
            className="text-xs border border-slate-300 rounded-lg px-2 py-1 max-w-[220px]"
          >
            {allStandards.map(s => (
              <option key={s.id} value={s.id}>
                {s._subject} · {(s.contentStandard || '').slice(0, 40)}…
              </option>
            ))}
          </select>
          <button onClick={onEditStandard} className="text-xs text-blue-600 font-medium">
            Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 bg-slate-50 rounded-xl p-3">
        <Meta label="Strand" value={strand?.name} />
        <Meta label="Sub-strand" value={subStrand?.name} />
      </div>

      <Meta label="Content Standard" value={standard.contentStandard} block />
      <div className="mt-2">
        <Meta label="Indicator" value={standard.indicator} block />
      </div>

      {standard.exemplars?.length > 0 && (
        <div className="mt-3 pt-2 border-t border-slate-100">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Exemplars
          </div>
          <ul className="text-sm text-slate-700 space-y-1">
            {standard.exemplars.map((e, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-slate-400">•</span>
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-slate-100">
        <ResourceGallery
          resources={resources}
          onManage={onManageMedia}
        />
      </div>
    </div>
  );
}

function Meta({ label, value, block }) {
  if (!value) return null;
  return (
    <div className={block ? '' : 'min-w-0'}>
      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</div>
      <div className="text-sm text-slate-800 leading-snug">{value}</div>
    </div>
  );
}
