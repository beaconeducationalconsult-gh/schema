import React from 'react';
import { Link } from 'react-router-dom';

export function ContextSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 pt-4 space-y-3 animate-pulse">
      <div className="h-24 bg-surface rounded-2xl" />
      <div className="h-56 bg-surface rounded-2xl" />
      <div className="h-32 bg-surface rounded-2xl" />
    </div>
  );
}

export function EmptyDay() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6 pb-20">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-3">🗓️</div>
        <h2 className="text-xl font-semibold text-slate-800">Let's set up your week</h2>
        <p className="text-sm text-slate-500 mt-1">
          Add your timetable slots and this screen will always show what you are teaching
          right now — and what's next.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center mt-5">
          <Link
            to="/schedule"
            className="px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-medium"
          >
            Build my timetable
          </Link>
          <Link
            to="/curriculum"
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium"
          >
            Add curriculum
          </Link>
        </div>
      </div>
    </div>
  );
}
