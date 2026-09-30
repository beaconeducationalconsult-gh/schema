import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Timer, CalendarDays, BookOpen, NotebookPen, History, Settings } from 'lucide-react';

const items = [
  { to: '/',           label: 'Now',        Icon: Timer },
  { to: '/schedule',   label: 'Week',       Icon: CalendarDays },
  { to: '/curriculum', label: 'Curriculum', Icon: BookOpen },
  { to: '/notes',      label: 'Notes',      Icon: NotebookPen },
  { to: '/history',    label: 'History',    Icon: History },
  { to: '/settings',   label: 'Settings',   Icon: Settings },
];

export default function AppNav() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  if (location.pathname.startsWith('/lesson/') && params.get('guided') === '1') {
    return null;
  }

  return (
    <nav aria-label="Primary" className="pb-[env(safe-area-inset-bottom)] fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200 print:hidden">
      <div className="max-w-3xl mx-auto grid grid-cols-6">
        {items.map(i => (
          <NavLink
            key={i.to}
            to={i.to}
            end={i.to === '/'}
            className={({ isActive }) =>
              `relative pt-2.5 pb-2 text-center text-[11px] flex flex-col items-center gap-1 transition focus-visible:outline-none focus-visible:bg-slate-100 ${
                isActive
                  ? 'text-slate-900 font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  aria-hidden="true"
                  className={`absolute top-0 h-0.5 w-8 rounded-full transition ${
                    isActive ? 'bg-slate-900' : 'bg-transparent'
                  }`}
                />
                <i.Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} aria-hidden="true" />
                <span>{i.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
