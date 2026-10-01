import React, { useRef, useState } from 'react';
import { GraduationCap, Check, Upload, Sparkles } from 'lucide-react';
import { getDefaultSettings } from '../../db/settings';
import { completeOnboarding } from '../../db/onboarding';
import { importBackup } from '../../db/backup';
import { CLASS_LEVELS, COMMON_SUBJECTS } from '../../lib/academicYear';
import { toast } from '../../lib/dialogs';

function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  'w-full border border-slate-300 bg-surface rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400';

export default function OnboardingScreen() {
  const [defaults] = useState(getDefaultSettings);
  const fileRef = useRef(null);

  const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState({
    teacherName: '',
    schoolName: '',
    classLevel: '',
    academicYear: defaults.academicYear,
  });
  const [terms, setTerms] = useState(defaults.terms);
  const [showTerms, setShowTerms] = useState(false);
  const [picked, setPicked] = useState(() => new Set(['Mathematics', 'English Language', 'Science']));
  const [custom, setCustom] = useState('');
  const [extra, setExtra] = useState([]);

  const setP = (patch) => setProfile((p) => ({ ...p, ...patch }));
  const setTerm = (i, patch) => setTerms((t) => t.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const toggle = (name) =>
    setPicked((s) => {
      const next = new Set(s);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const addCustom = () => {
    const name = custom.trim();
    if (!name) return;
    if (![...COMMON_SUBJECTS, ...extra].some((n) => n.toLowerCase() === name.toLowerCase())) {
      setExtra((e) => [...e, name]);
    }
    setPicked((s) => new Set(s).add(name));
    setCustom('');
  };

  const finish = async ({ useDemo }) => {
    setBusy(true);
    try {
      await completeOnboarding({
        profile,
        terms,
        useDemo,
        subjectNames: [...picked],
      });
    } catch (e) {
      toast.error(e.message || 'Could not finish setup.');
      setBusy(false);
    }
  };

  const restore = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      await importBackup(JSON.parse(await file.text()), { mode: 'replace' });
    } catch (e) {
      toast.error(e.message || 'That file could not be restored.');
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="px-5 pt-8 pb-4 max-w-xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary text-on-primary flex items-center justify-center">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">Welcome to Teaching Companion</h1>
            <p className="text-sm text-slate-500">Know what you are teaching, right now — set up in 30 seconds.</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 pb-8 max-w-xl w-full mx-auto">
        <div className="bg-surface rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
          {/* Profile — always visible, no steps */}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-3">About you & your class</h2>
            <Field label="Your name">
              <input className={inputCls} value={profile.teacherName} onChange={(e) => setP({ teacherName: e.target.value })} placeholder="e.g. Mr. Kofi Mensah" autoComplete="name" />
            </Field>
            <Field label="School name">
              <input className={inputCls} value={profile.schoolName} onChange={(e) => setP({ schoolName: e.target.value })} placeholder="e.g. Demo Basic School" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Class level">
                <input className={inputCls} list="class-levels" value={profile.classLevel} onChange={(e) => setP({ classLevel: e.target.value })} placeholder="e.g. Basic 6" />
                <datalist id="class-levels">
                  {CLASS_LEVELS.map((c) => <option key={c} value={c} />)}
                </datalist>
              </Field>
              <Field label="Academic year">
                <input className={inputCls} value={profile.academicYear} onChange={(e) => setP({ academicYear: e.target.value })} />
              </Field>
            </div>
            <p className="text-xs text-slate-400 mt-1">Shown on printed lesson plans. Everything stays on this device. Leave blank to skip.</p>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-2">What do you teach?</h2>
            <p className="text-xs text-slate-500 mb-3">Pick your subjects. You can add strands & standards next, or bulk-import from Curriculum.</p>
            <div className="flex flex-wrap gap-2">
              {[...COMMON_SUBJECTS, ...extra].map((name) => {
                const on = picked.has(name);
                return (
                  <button key={name} type="button" onClick={() => toggle(name)} aria-pressed={on} className={`px-3 py-1.5 rounded-full text-xs border flex items-center gap-1.5 min-h-[32px] transition ${on ? 'bg-primary text-on-primary border-transparent' : 'bg-surface text-slate-700 border-slate-300 hover:bg-slate-50'}`}>
                    {on && <Check size={12} />}
                    {name}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 mt-3">
              <input className={inputCls} value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCustom()} placeholder="Another subject…" />
              <button type="button" onClick={addCustom} className="px-4 rounded-xl border border-slate-300 text-xs font-medium hover:bg-slate-100 min-h-[44px]">
                Add
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <button type="button" onClick={() => setShowTerms((v) => !v)} className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-900">
              <span>Term dates — {defaults.academicYear} · {terms[0]?.from?.slice(5)} – {terms[0]?.to?.slice(5)} etc.</span>
              <span className="text-slate-400">{showTerms ? '▾ Hide' : '▸ Edit'}</span>
            </button>
            <p className="text-xs text-slate-400 mt-1">We filled Ghana's 3 terms for you. Tap Edit to adjust — powers the History “This term” filter.</p>
            {showTerms && (
              <div className="mt-3 space-y-2">
                {terms.map((t, i) => (
                  <div key={i} className="grid grid-cols-[72px_1fr_1fr] gap-2 items-center">
                    <input aria-label={`Term ${i + 1} name`} className="text-xs border border-slate-300 bg-surface rounded-lg px-2.5 py-2 min-h-[36px]" value={t.label} onChange={(e) => setTerm(i, { label: e.target.value })} />
                    <input aria-label={`${t.label} starts`} type="date" className="text-xs border border-slate-300 bg-surface rounded-lg px-2.5 py-2 min-h-[36px]" value={t.from} onChange={(e) => setTerm(i, { from: e.target.value })} />
                    <input aria-label={`${t.label} ends`} type="date" className="text-xs border border-slate-300 bg-surface rounded-lg px-2.5 py-2 min-h-[36px]" value={t.to} onChange={(e) => setTerm(i, { to: e.target.value })} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <button onClick={() => finish({ useDemo: false })} disabled={busy} className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-primary hover:bg-primary-hover text-on-primary text-sm font-semibold disabled:opacity-50 min-h-[48px]">
            <Check size={16} /> {picked.size ? `Start teaching with ${picked.size} subject${picked.size > 1 ? 's' : ''}` : 'Start empty — add subjects later'}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => finish({ useDemo: true })} disabled={busy} className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50 min-h-[44px]">
              <Sparkles size={14} /> Explore demo data
            </button>
            <button onClick={() => fileRef.current?.click()} disabled={busy} className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50 min-h-[44px]">
              <Upload size={14} /> Restore backup
            </button>
          </div>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => restore(e.target.files?.[0])} />
          <p className="text-xs text-slate-400 text-center pt-1">All optional — skip and add timetable/curriculum next. Demo data is available anytime in Settings → Reset.</p>
        </div>
      </main>
    </div>
  );
}
