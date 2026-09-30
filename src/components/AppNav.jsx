import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const items = [
  { to: '/',           label: 'Now',        icon: '⏱️' },
  { to: '/schedule',   label: 'Week',       icon: '📅' },
  { to: '/curriculum', label: 'Curriculum', icon: '📚' },
  { to: '/notes',      label: 'Notes',      icon: '📓' },
  { to: '/history',    label: 'History',    icon: '🕘' },
  { to: '/settings',   label: 'Settings',   icon: '⚙️' },
];

export default function AppNav() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  if (location.pathname.startsWith('/lesson/') && params.get('guided') === '1') {
    return null;
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200 print:hidden">
      <div className="max-w-3xl mx-auto grid grid-cols-6">
        {items.map(i => (
          <NavLink
            key={i.to}
            to={i.to}
            end={i.to === '/'}
            className={({ isActive }) =>
              `py-2 text-center text-[11px] flex flex-col items-center gap-0.5 transition ${
                isActive
                  ? 'text-slate-900 font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <span className="text-lg leading-none">{i.icon}</span>
            <span>{i.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
