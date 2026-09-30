import React from 'react';

export default function ProfileSection({ settings, onChange }) {
  const field = (key, label, placeholder = '') => (
    <div className="mb-3">
      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
        {label}
      </label>
      <input
        value={settings[key] || ''}
        onChange={(e) => onChange({ [key]: e.target.value })}
        placeholder={placeholder}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
      />
    </div>
  );

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
        👤 Teacher Profile
      </h2>
      {field('teacherName', 'Teacher name', 'e.g. Mr. Kofi Mensah')}
      {field('schoolName', 'School name', 'e.g. Achimota Basic School')}
      <div className="grid grid-cols-2 gap-3">
        {field('classLevel', 'Class level', 'e.g. Basic 6')}
        {field('academicYear', 'Academic year', '2026/2027')}
      </div>
    </section>
  );
}
