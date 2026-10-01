import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { notes as noteRepo } from '../../db/helpers';

export default function NotesPanel({ lessonId, standardId, notes }) {
  const [text, setText] = useState('');
  const [tag, setTag] = useState('prep');

  const save = async () => {
    if (!text.trim()) return;
    await noteRepo.add({
      lessonId,
      standardId: standardId || null,
      body: text.trim(),
      tags: tag ? [tag] : [],
    });
    setText('');
  };
  const remove = async (id) => {
    await noteRepo.remove(id);
  };

  return (
    <section className="bg-surface rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          📝 Lesson Notes
        </div>
        <Link to="/notes" className="text-xs text-blue-600 hover:underline print:hidden">
          All Notes Hub →
        </Link>
      </div>
      <div className="flex gap-1.5 mb-2 print:hidden flex-wrap">
        {['prep', 'remedial', 'insight', 'homework', 'absent'].map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTag(t)}
            className={`text-[10px] px-2 py-0.5 rounded-full border ${
              tag === t
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}
          >
            #{t}
          </button>
        ))}
      </div>
      <div className="flex gap-2 print:hidden">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          placeholder="Add a note…"
          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <button
          onClick={save}
          className="px-4 py-2 text-sm rounded-lg bg-primary text-on-primary"
        >
          Add
        </button>
      </div>
      {notes.length > 0 && (
        <ul className="mt-3 space-y-2">
          {notes.map(n => (
            <li
              key={n.id}
              className="text-sm text-slate-700 border-l-2 border-slate-200 pl-3 flex justify-between items-start gap-2"
            >
              <div>
                <span>{n.body}</span>
                {n.tags?.length > 0 && (
                  <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    #{n.tags[0]}
                  </span>
                )}
              </div>
              <button
                onClick={() => remove(n.id)}
                className="text-rose-400 hover:text-rose-600 text-xs print:hidden"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
