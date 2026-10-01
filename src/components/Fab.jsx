import React from 'react';
import { useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';

const FAB_CONFIG = {
  '/': { label: 'Add step', extended: 'Add step', icon: Plus, event: 'tc-open-add-step' },
  '/schedule': { label: 'Add slot', extended: 'Add slot', icon: Plus, event: 'tc-open-add-slot' },
  '/timetable': { label: 'Add slot', extended: 'Add slot', icon: Plus, event: 'tc-open-add-slot' },
  '/curriculum': { label: 'Add subject', extended: 'Add subject', icon: Plus, event: 'tc-open-add-subject' },
  '/notes': { label: 'Add note', extended: 'Add note', icon: Plus, event: 'tc-open-add-note' },
};

export default function Fab() {
  const location = useLocation();
  const pathname = location.pathname;

  // Hide in guided mode and onboarding
  const params = new URLSearchParams(location.search);
  if (pathname.startsWith('/lesson/') && params.get('guided') === '1') return null;

  // Exact match, fallback to prefix
  let cfg = FAB_CONFIG[pathname];
  if (!cfg) {
    if (pathname.startsWith('/lesson/')) return null;
    return null;
  }

  const onClick = () => {
    window.dispatchEvent(new CustomEvent(cfg.event));
    // For Today, also scroll to teaching steps
    if (pathname === '/') {
      document.getElementById('teaching-steps')?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <button
      onClick={onClick}
      aria-label={cfg.label}
      className="fixed bottom-24 right-4 z-30 w-14 h-14 rounded-full bg-primary hover:bg-primary-hover text-on-primary shadow-lg flex items-center justify-center print:hidden"
      title={cfg.label}
    >
      <cfg.icon size={24} />
    </button>
  );
}
