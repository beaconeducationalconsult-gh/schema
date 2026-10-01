import React from 'react';
import { Sun, Moon, Monitor, Presentation } from 'lucide-react';
import { useDisplay, setTheme, setProjector } from '../../lib/theme';

const THEME_OPTIONS = [
  { id: 'system', label: 'System', Icon: Monitor },
  { id: 'light', label: 'Light', Icon: Sun },
  { id: 'dark', label: 'Dark', Icon: Moon },
];

/** Theme + projector mode. Applied instantly and stored on this device only (no Save needed). */
export default function DisplaySection() {
  const { theme, projector } = useDisplay();

  return (
    <section className="bg-surface rounded-2xl border border-slate-200 p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
        🎨 Display
      </h2>

      <div className="text-xs text-slate-500 mb-2">Theme</div>
      <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2 mb-5">
        {THEME_OPTIONS.map(({ id, label, Icon }) => {
          const on = theme === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setTheme(id)}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-sm transition ${
                on
                  ? 'bg-primary text-on-primary border-primary font-medium'
                  : 'bg-surface text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={projector}
          onChange={(e) => setProjector(e.target.checked)}
          className="mt-1 w-4 h-4"
        />
        <span>
          <span className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
            <Presentation size={16} aria-hidden="true" /> Projector mode
          </span>
          <span className="block text-xs text-slate-500 mt-0.5">
            Larger text and stronger contrast for showing the screen to your class. You can also
            toggle it from guided lesson mode.
          </span>
        </span>
      </label>
    </section>
  );
}
