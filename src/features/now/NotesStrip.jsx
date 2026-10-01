import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { notes as noteRepo } from '../../db/helpers';

export default function NotesStrip({ lesson, notes }) {
  const [text, setText] = useState('');
  const [tag, setTag] = useState('prep');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!lesson || !text.trim()) return;
    setSaving(true);
    const payload = {
      lessonId: lesson.id,
      standardId: lesson.standardId,
      body: text.trim(),
      tags: tag ? [tag] : [],
    };
    await noteRepo.add(payload);
    setText('');
    setSaving(false);
  };

  return (
    <section className="max-w-3xl mx-auto px-4 pt-3">
      <div className="bg-surface rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            📝 Quick Lesson Notes
          </div>
          <Link to="/notes" className="text-xs text-blue-600 font-medium hover:underline">
            All Notes Hub →
          </Link>
        </div>

        <div className="flex gap-1.5 mb-2 flex-wrap">
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

        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            placeholder="Jot a reflection or reminder about this class…"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          <button
            onClick={save}
            disabled={!text.trim() || saving}
            className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-medium disabled:opacity-40"
          >
            Add
          </button>
        </div>

        {notes.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {notes.map((n) => (
              <li
                key={n.id}
                className="text-xs text-slate-700 border-l-2 border-blue-400 pl-2.5 py-0.5 flex items-center justify-between gap-2"
              >
                <span>{n.body}</span>
                {n.tags?.length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                    #{n.tags[0]}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
