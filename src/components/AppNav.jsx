import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Timer,
  CalendarDays,
  BookOpen,
  NotebookPen,
  History,
  Settings,
  Ellipsis,
  Presentation,
} from 'lucide-react';
import { useDisplay, setProjector } from '../lib/theme';

// Four everyday destinations stay on the bar; the rest live under "More".
// Phase 0: Week → Timetable (same route /schedule, clearer mental model)
const PRIMARY = [
  { to: '/', label: 'Now', Icon: Timer },
  { to: '/schedule', label: 'Timetable', Icon: CalendarDays },
  { to: '/curriculum', label: 'Curriculum', Icon: BookOpen },
  { to: '/notes', label: 'Notes', Icon: NotebookPen },
];
const MORE = [
  { to: '/history', label: 'History', Icon: History },
  { to: '/settings', label: 'Settings', Icon: Settings },
];

const tabClass = (active) =>
  `relative pt-3 pb-2.5 text-center text-xs flex flex-col items-center gap-1.5 transition focus-visible:outline-none focus-visible:bg-slate-100 min-h-[56px] justify-center ${
    active ? 'text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-800'
  }`;

function ActiveBar({ active }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute top-0 h-0.5 w-8 rounded-full transition ${
        active ? 'bg-primary' : 'bg-transparent'
      }`}
    />
  );
}

export default function AppNav() {
  const location = useLocation();
  // The menu is "open at" a path, so navigating anywhere closes it without an effect.
  const [openAt, setOpenAt] = useState(null);
  const open = openAt === location.pathname;
  const close = () => setOpenAt(null);
  const buttonRef = useRef(null);
  const firstItemRef = useRef(null);
  const { projector } = useDisplay();

  useEffect(() => {
    if (!open) return undefined;
    firstItemRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpenAt(null);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const params = new URLSearchParams(location.search);
  if (location.pathname.startsWith('/lesson/') && params.get('guided') === '1') {
    return null;
  }

  const moreActive = MORE.some((m) => location.pathname.startsWith(m.to));

  return (
    <>
      {open && (
        <div
          data-testid="more-backdrop"
          className="fixed inset-0 z-30 print:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <nav
        aria-label="Primary"
        className="pb-[env(safe-area-inset-bottom)] fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur border-t border-slate-200 print:hidden"
      >
        {open && (
          <div
            id="more-menu"
            className="absolute bottom-full right-2 mb-2 w-56 rounded-2xl border border-slate-200 bg-surface shadow-xl p-1.5"
          >
            <ul aria-label="More">
              {MORE.map((m, i) => (
                <li key={m.to}>
                  <Link
                    to={m.to}
                    ref={i === 0 ? firstItemRef : undefined}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:bg-slate-100 min-h-[44px]"
                  >
                    <m.Icon size={18} aria-hidden="true" />
                    {m.label}
                  </Link>
                </li>
              ))}
              <li className="mt-1 pt-1 border-t border-slate-100">
                <button
                  type="button"
                  role="switch"
                  aria-checked={projector}
                  onClick={() => setProjector(!projector)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:bg-slate-100 min-h-[44px]"
                >
                  <Presentation size={18} aria-hidden="true" />
                  <span className="flex-1 text-left">Projector mode</span>
                  <span
                    className={`text-xs font-semibold uppercase ${
                      projector ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    {projector ? 'On' : 'Off'}
                  </span>
                </button>
              </li>
            </ul>
          </div>
        )}

        <div className="max-w-3xl mx-auto grid grid-cols-5">
          {PRIMARY.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              end={i.to === '/'}
              className={({ isActive }) => tabClass(isActive)}
            >
              {({ isActive }) => (
                <>
                  <ActiveBar active={isActive} />
                  <i.Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} aria-hidden="true" />
                  <span>{i.label}</span>
                </>
              )}
            </NavLink>
          ))}

          <button
            ref={buttonRef}
            type="button"
            aria-haspopup="true"
            aria-expanded={open}
            aria-controls="more-menu"
            onClick={() => setOpenAt(open ? null : location.pathname)}
            className={tabClass(moreActive || open)}
          >
            <ActiveBar active={moreActive} />
            <Ellipsis size={20} strokeWidth={moreActive || open ? 2.4 : 1.8} aria-hidden="true" />
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
