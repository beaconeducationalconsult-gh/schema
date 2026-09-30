import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { resources as resourceRepo } from '../db/helpers';
import { PRESET_DIAGRAMS } from '../lib/classroomMedia';

export default function ResourceManagerModal({ standard, onClose, onChanged }) {
  const [tab, setTab] = useState('upload'); // 'upload' | 'presets' | 'link'
  const [type, setType] = useState('video');
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [uploadPreview, setUploadPreview] = useState(null);

  // Live: updates itself after every add / remove / caption edit.
  const items = useLiveQuery(
    () => (standard?.id ? resourceRepo.byStandard(standard.id) : []),
    [standard?.id],
    []
  );

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUploadPreview(reader.result);
      if (!caption) setCaption(file.name.replace(/\.[^.]+$/, ''));
    };
    reader.readAsDataURL(file);
  };

  const saveUploadedImage = async () => {
    if (!uploadPreview || !standard?.id) return;
    await resourceRepo.add({
      standardId: standard.id,
      type: 'image',
      url: uploadPreview,
      caption: caption.trim() || 'Uploaded Diagram',
    });
    setUploadPreview(null);
    setCaption('');
    onChanged?.();
  };

  const addPreset = async (preset) => {
    if (!standard?.id) return;
    await resourceRepo.add({
      standardId: standard.id,
      type: preset.type,
      url: preset.url,
      caption: preset.caption,
    });
    onChanged?.();
  };

  const saveLink = async () => {
    if (!url.trim() || !standard?.id) return;
    await resourceRepo.add({
      standardId: standard.id,
      type,
      url: url.trim(),
      caption: caption.trim() || url.trim(),
    });
    setUrl('');
    setCaption('');
    onChanged?.();
  };

  const remove = async (id) => {
    await resourceRepo.remove(id);
    onChanged?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              🖼️ Teaching Resources & Media
            </h3>
            <p className="text-xs text-slate-500 line-clamp-1">
              {standard?.indicator || standard?.contentStandard}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-sm px-2"
          >
            ✕
          </button>
        </div>

        {/* Existing resources list */}
        {items.length > 0 && (
          <div className="mb-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Attached to this standard ({items.length})
            </div>
            <ul className="space-y-2">
              {items.map(item => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 p-2 rounded-xl border border-slate-200 bg-slate-50"
                >
                  {item.type === 'image' || item.url?.startsWith('data:image') ? (
                    <img
                      src={item.url}
                      alt={item.caption}
                      className="w-14 h-10 object-cover rounded-lg bg-slate-900 shrink-0"
                    />
                  ) : (
                    <span className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center text-lg shrink-0">
                      {item.type === 'video' ? '🎬' : item.type === 'pdf' ? '📄' : '🔗'}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-slate-800 truncate">
                      {item.caption}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase">{item.type}</div>
                  </div>
                  <button
                    onClick={() => remove(item.id)}
                    className="text-xs text-rose-500 hover:underline px-2"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Mode tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-4">
          <TabBtn active={tab === 'upload'} onClick={() => setTab('upload')}>
            📷 Upload Image
          </TabBtn>
          <TabBtn active={tab === 'presets'} onClick={() => setTab('presets')}>
            📐 Built-in Diagrams
          </TabBtn>
          <TabBtn active={tab === 'link'} onClick={() => setTab('link')}>
            🎬 Video / PDF / Link
          </TabBtn>
        </div>

        {tab === 'upload' && (
          <div className="space-y-3 border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500">
              Upload a photo of a textbook page, chart, or diagram. Stored offline on this device.
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-slate-900 file:text-white"
            />
            {uploadPreview && (
              <img
                src={uploadPreview}
                alt="Preview"
                className="max-h-40 rounded-lg border border-slate-200 mx-auto"
              />
            )}
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption (e.g. Labelled Diagram of a Plant)…"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
            <button
              onClick={saveUploadedImage}
              disabled={!uploadPreview}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium disabled:opacity-40"
            >
              Attach Image to Standard
            </button>
          </div>
        )}

        {tab === 'presets' && (
          <div className="space-y-2 border border-slate-200 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-2">
              Tap any offline classroom diagram below to attach it to this standard:
            </p>
            {PRESET_DIAGRAMS.map(p => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-2 rounded-xl border border-slate-200 hover:bg-slate-50"
              >
                <img
                  src={p.url}
                  alt={p.caption}
                  className="w-20 h-12 object-contain rounded bg-slate-900 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-800 truncate">
                    {p.caption}
                  </div>
                  <div className="text-[10px] text-slate-400">Offline SVG Diagram</div>
                </div>
                <button
                  onClick={() => addPreset(p)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs shrink-0"
                >
                  + Attach
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'link' && (
          <div className="space-y-3 border border-slate-200 rounded-xl p-4">
            <div className="grid grid-cols-4 gap-1.5">
              {['video', 'pdf', 'link', 'image'].map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`py-1.5 rounded-lg text-xs font-medium uppercase border ${
                    type === t
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Title / Caption (e.g. NaCCA Fractions Video Clip)…"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono"
            />
            <button
              onClick={saveLink}
              disabled={!url.trim()}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium disabled:opacity-40"
            >
              Add Resource Link
            </button>
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition ${
        active ? 'bg-white shadow text-slate-900' : 'text-slate-500'
      }`}
    >
      {children}
    </button>
  );
}
