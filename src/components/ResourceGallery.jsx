import React, { useState } from 'react';

const TYPE_BADGE = {
  image: { icon: '🖼️', label: 'Image / Diagram', bg: 'bg-purple-100 text-purple-800' },
  video: { icon: '🎬', label: 'Video',           bg: 'bg-rose-100 text-rose-800' },
  pdf:   { icon: '📄', label: 'PDF',             bg: 'bg-amber-100 text-amber-800' },
  link:  { icon: '🔗', label: 'Link',            bg: 'bg-blue-100 text-blue-800' },
};

export default function ResourceGallery({
  resources = [],
  onManage,
  dark = false,
  compact = false,
}) {
  const [lightboxIdx, setLightboxIdx] = useState(null);

  if (resources.length === 0 && !onManage) return null;

  const activeRes = lightboxIdx != null ? resources[lightboxIdx] : null;

  return (
    <div className={dark ? 'text-white' : ''}>
      <div className="flex items-center justify-between mb-2">
        <div
          className={`text-[10px] font-semibold uppercase tracking-wider ${
            dark ? 'text-white/60' : 'text-slate-400'
          }`}
        >
          🖼️ Teaching Resources & Media ({resources.length})
        </div>
        {onManage && (
          <button
            onClick={onManage}
            className={`text-xs font-medium hover:underline print:hidden ${
              dark ? 'text-sky-300' : 'text-blue-600'
            }`}
          >
            + Manage Media
          </button>
        )}
      </div>

      {resources.length === 0 ? (
        <div
          className={`text-xs rounded-xl border border-dashed p-3 text-center ${
            dark
              ? 'border-white/20 text-white/50'
              : 'border-slate-200 text-slate-400 bg-slate-50/50'
          }`}
        >
          No diagrams, images, or videos attached to this standard yet.{' '}
          {onManage && (
            <button onClick={onManage} className="text-blue-600 underline ml-1">
              Add resource
            </button>
          )}
        </div>
      ) : (
        <div
          className={`grid gap-2.5 ${
            compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'
          }`}
        >
          {resources.map((res, idx) => {
            const meta = TYPE_BADGE[res.type] || TYPE_BADGE.link;
            const isImage = res.type === 'image' || (res.url && res.url.startsWith('data:image'));

            return (
              <div
                key={res.id || idx}
                onClick={() => setLightboxIdx(idx)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setLightboxIdx(idx)}
                className={`group cursor-pointer rounded-xl border overflow-hidden transition flex flex-col ${
                  dark
                    ? 'bg-zinc-800/90 border-white/15 hover:border-sky-400'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-400 hover:shadow-sm'
                }`}
              >
                {isImage ? (
                  <div className="h-32 bg-zinc-900 flex items-center justify-center overflow-hidden relative">
                    <img
                      src={res.url}
                      alt={res.caption || 'Teaching diagram'}
                      className="w-full h-full object-contain group-hover:scale-[1.02] transition"
                    />
                    <span className="absolute bottom-1.5 right-1.5 text-[10px] px-2 py-0.5 rounded-full bg-black/70 text-white">
                      🔍 Expand
                    </span>
                  </div>
                ) : (
                  <div
                    className={`p-3 flex items-center gap-2.5 ${
                      dark ? 'bg-zinc-800' : 'bg-surface'
                    }`}
                  >
                    <span className="text-2xl">{meta.icon}</span>
                    <div className="min-w-0 flex-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${meta.bg}`}>
                        {meta.label}
                      </span>
                      <div className="text-xs truncate mt-1 opacity-75">{res.url}</div>
                    </div>
                  </div>
                )}

                <div className="px-3 py-2 flex items-center justify-between gap-2">
                  <span
                    className={`text-xs font-medium truncate ${
                      dark ? 'text-white/90' : 'text-slate-700'
                    }`}
                  >
                    {res.caption || meta.label}
                  </span>
                  <span
                    className={`text-[10px] shrink-0 ${
                      dark ? 'text-sky-300' : 'text-blue-600'
                    }`}
                  >
                    View
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Lightbox for Classroom Projection / Observation */}
      {activeRes && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col justify-between p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <div
            className="flex items-center justify-between text-white max-w-5xl w-full mx-auto py-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="text-xs uppercase tracking-wider text-white/60">
                Classroom Visual Prompt ({lightboxIdx + 1} of {resources.length})
              </div>
              <div className="text-base sm:text-lg font-semibold">
                {activeRes.caption || 'Teaching Resource'}
              </div>
            </div>
            <button
              onClick={() => setLightboxIdx(null)}
              className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-sm font-medium"
            >
              ✕ Close
            </button>
          </div>

          <div
            className="flex-1 flex items-center justify-center overflow-auto my-2"
            onClick={(e) => e.stopPropagation()}
          >
            {activeRes.type === 'image' || activeRes.url?.startsWith('data:image') ? (
              <img
                src={activeRes.url}
                alt={activeRes.caption || 'Diagram'}
                className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl bg-zinc-900"
              />
            ) : (
              <div className="bg-zinc-800 text-white rounded-2xl p-8 max-w-lg w-full text-center border border-white/15">
                <div className="text-5xl mb-3">
                  {TYPE_BADGE[activeRes.type]?.icon || '🔗'}
                </div>
                <h3 className="text-lg font-bold mb-2">{activeRes.caption}</h3>
                <p className="text-xs text-white/60 break-all mb-5">{activeRes.url}</p>
                <a
                  href={activeRes.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
                >
                  Open External Resource ↗
                </a>
              </div>
            )}
          </div>

          {resources.length > 1 && (
            <div
              className="flex items-center justify-center gap-3 pb-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() =>
                  setLightboxIdx((lightboxIdx - 1 + resources.length) % resources.length)
                }
                className="px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs"
              >
                ← Previous
              </button>
              <button
                onClick={() => setLightboxIdx((lightboxIdx + 1) % resources.length)}
                className="px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
