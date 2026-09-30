import React, { useState } from 'react';

export default function InlineAdd({ label, placeholder = 'Name…', onAdd }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');

  const submit = () => {
    const v = value.trim();
    if (!v) return;
    onAdd(v);
    setValue('');
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-blue-600 font-medium hover:underline"
      >
        {label}
      </button>
    );
  }

  return (
    <div className="flex gap-2 items-center">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder={placeholder}
        className="text-sm border border-slate-300 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-slate-400"
      />
      <button
        onClick={submit}
        className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-900 text-white"
      >
        Save
      </button>
      <button
        onClick={() => { setOpen(false); setValue(''); }}
        className="text-xs text-slate-500"
      >
        Cancel
      </button>
    </div>
  );
}
