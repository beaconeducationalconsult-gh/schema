import React, { useState } from 'react';
import { bulkImportCurriculum } from '../../db/curriculum';

const SAMPLE_CSV = `Strand,Sub-strand,Content Standard,Indicator,Exemplars
Strand 3: Geometry and Measurement,B6.3.1 2D & 3D Shapes,B6.3.1.1 Demonstrate understanding of prisms and pyramids.,B6.3.1.1.1 Identify and sort 3D shapes by faces edges and vertices.,Count faces edges and vertices of cuboids and triangular prisms | Construct nets of a cube using manila card
Strand 4: Handling Data,B6.4.1 Data Collection & Organization,B6.4.1.1 Collect and interpret data using double bar graphs.,B6.4.1.1.1 Draw and interpret double bar graphs to compare two data sets.,Compare boys and girls attendance across five school days`;

export default function BulkImportModal({ subject, onClose, onImported }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const handleImport = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const res = await bulkImportCurriculum(subject.id, text);
      alert(
        `Imported ${res.standardsCreated} standards (${res.strandsCreated} new strands, ${res.subStrandsCreated} new sub-strands).`
      );
      onImported?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl p-5 shadow-xl"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">
            Bulk Import CSV / TSV · {subject.name}
          </h3>
          <button
            onClick={() => setText(SAMPLE_CSV)}
            className="text-xs text-blue-600 hover:underline font-medium"
          >
            Load sample rows
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-3">
          Paste comma-separated (CSV) or tab-separated (TSV) rows with columns:{' '}
          <b>Strand, Sub-strand, Content Standard, Indicator, Exemplars</b> (separate multiple exemplars with <code>|</code> or <code>;</code>).
        </p>

        <textarea
          rows={7}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Strand,Sub-strand,Content Standard,Indicator,Exemplar 1 | Exemplar 2"
          className="w-full border border-slate-300 rounded-lg p-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-400"
        />

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!text.trim() || busy}
            className="px-4 py-2 text-sm rounded-lg bg-slate-900 text-white disabled:opacity-40"
          >
            {busy ? 'Importing…' : 'Import Standards'}
          </button>
        </div>
      </div>
    </div>
  );
}
