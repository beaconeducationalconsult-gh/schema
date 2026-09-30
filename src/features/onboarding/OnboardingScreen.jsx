import React, { useRef, useState } from 'react';
import { GraduationCap, ArrowRight, ArrowLeft, Check, Upload, Sparkles } from 'lucide-react';
import { getDefaultSettings } from '../../db/settings';
import { completeOnboarding } from '../../db/onboarding';
import { importBackup } from '../../db/backup';
import { CLASS_LEVELS, COMMON_SUBJECTS } from '../../lib/academicYear';
import { toast } from '../../lib/dialogs';

const STEPS = ['About you', 'Term dates', 'Subjects'];

function Field({ label, children }) {
  return (
    <label className="block mb-4">
      <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
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

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState({
    teacherName: '',
    schoolName: '',
    classLevel: '',
    academicYear: defaults.academicYear,
  });
  const [terms, setTerms] = useState(defaults.terms);
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
      // App watches the `onboarded` setting and swaps to the main UI by itself.
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
            <p className="text-sm text-slate-500">Know what you are teaching, right now.</p>
          </div>
        </div>

        <ol className="flex items-center gap-2 mt-6" aria-label="Setup progress">
          {STEPS.map((label, i) => (
            <li key={label} className="flex-1" aria-current={i === step ? 'step' : undefined}>
              <div className={`h-1.5 rounded-full ${i <= step ? 'bg-primary' : 'bg-slate-200'}`} />
              <div className={`text-[11px] mt-1.5 ${i === step ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
                {i + 1}. {label}
              </div>
            </li>
          ))}
        </ol>
      </header>

      <main className="flex-1 px-5 pb-8 max-w-xl w-full mx-auto">
        <div className="bg-surface rounded-2xl border border-slate-200 p-5 shadow-sm">
          {step === 0 && (
            <>
              <h2 className="text-base font-semibold mb-1">Tell us about your class</h2>
              <p className="text-sm text-slate-500 mb-5">
                Shown on printed lesson plans. Everything stays on this device.
              </p>
              <Field label="Your name">
                <input
                  className={inputCls}
                  value={profile.teacherName}
                  onChange={(e) => setP({ teacherName: e.target.value })}
                  placeholder="e.g. Mr. Kofi Mensah"
                  autoComplete="name"
                />
              </Field>
              <Field label="School name">
                <input
                  className={inputCls}
                  value={profile.schoolName}
                  onChange={(e) => setP({ schoolName: e.target.value })}
                  placeholder="e.g. Achimota Basic School"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Class level">
                  <input
                    className={inputCls}
                    list="class-levels"
                    value={profile.classLevel}
                    onChange={(e) => setP({ classLevel: e.target.value })}
                    placeholder="e.g. Basic 6"
                  />
                  <datalist id="class-levels">
                    {CLASS_LEVELS.map((c) => <option key={c} value={c} />)}
                  </datalist>
                </Field>
                <Field label="Academic year">
                  <input
                    className={inputCls}
                    value={profile.academicYear}
                    onChange={(e) => setP({ academicYear: e.target.value })}
                  />
                </Field>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="text-base font-semibold mb-1">Term dates</h2>
              <p className="text-sm text-slate-500 mb-5">
                We suggested dates based on the usual Ghana calendar. Adjust them to match your
                school's — they power the "This term" filter in History.
              </p>
              <div className="space-y-3">
                {terms.map((t, i) => (
                  <div key={i} className="grid grid-cols-[72px_1fr_1fr] gap-2 items-center">
                    <input
                      aria-label={`Term ${i + 1} name`}
                      className="text-sm border border-slate-300 bg-surface rounded-lg px-2.5 py-2"
                      value={t.label}
                      onChange={(e) => setTerm(i, { label: e.target.value })}
                    />
                    <input
                      aria-label={`${t.label} starts`}
                      type="date"
                      className="text-sm border border-slate-300 bg-surface rounded-lg px-2.5 py-2"
                      value={t.from}
                      onChange={(e) => setTerm(i, { from: e.target.value })}
                    />
                    <input
                      aria-label={`${t.label} ends`}
                      type="date"
                      className="text-sm border border-slate-300 bg-surface rounded-lg px-2.5 py-2"
                      value={t.to}
                      onChange={(e) => setTerm(i, { to: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-base font-semibold mb-1">What do you teach?</h2>
              <p className="text-sm text-slate-500 mb-4">
                Pick your subjects. You'll add strands, standards and your timetable next — or
                import a curriculum in bulk from the Curriculum tab.
              </p>
              <div className="flex flex-wrap gap-2">
                {[...COMMON_SUBJECTS, ...extra].map((name) => {
                  const on = picked.has(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => toggle(name)}
                      aria-pressed={on}
                      className={`px-3 py-1.5 rounded-full text-sm border flex items-center gap-1.5 transition ${
                        on
                          ? 'bg-primary text-on-primary border-transparent'
                          : 'bg-surface text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {on && <Check size={14} />}
                      {name}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-4">
                <input
                  className={inputCls}
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustom()}
                  placeholder="Another subject…"
                />
                <button
                  type="button"
                  onClick={addCustom}
                  className="px-4 rounded-xl border border-slate-300 text-sm font-medium hover:bg-slate-100"
                >
                  Add
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between mt-5">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              disabled={busy}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-200/60"
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <span />
          )}

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-on-primary text-sm font-medium"
            >
              Next <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={() => finish({ useDemo: false })}
              disabled={busy}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-on-primary text-sm font-medium disabled:opacity-50"
            >
              <Check size={16} /> {picked.size ? `Start with ${picked.size} subject${picked.size > 1 ? 's' : ''}` : 'Start empty'}
            </button>
          )}
        </div>

        <div className="mt-8 pt-5 border-t border-slate-200 grid gap-2 sm:grid-cols-2">
          <button
            onClick={() => finish({ useDemo: true })}
            disabled={busy}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            <Sparkles size={16} /> Explore with demo data
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            <Upload size={16} /> Restore from backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => restore(e.target.files?.[0])}
          />
        </div>
      </main>
    </div>
  );
}
