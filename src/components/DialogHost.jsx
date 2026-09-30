import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { dialogStore, dismissToast } from '../lib/dialogs';

const TONES = {
  info: { icon: Info, cls: 'bg-slate-900 text-white' },
  success: { icon: CheckCircle2, cls: 'bg-emerald-700 text-white' },
  error: { icon: AlertTriangle, cls: 'bg-rose-700 text-white' },
};

function ConfirmModal({ dialog }) {
  const confirmRef = useRef(null);

  useEffect(() => {
    confirmRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') dialog.resolve(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog]);

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 print:hidden"
      onClick={() => dialog.resolve(false)}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="text-base font-semibold text-slate-900">
          {dialog.title}
        </h2>
        {dialog.message && (
          <p className="text-sm text-slate-600 mt-1.5 whitespace-pre-line">{dialog.message}</p>
        )}
        <div className="grid grid-cols-2 gap-2 mt-5">
          <button
            onClick={() => dialog.resolve(false)}
            className="py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
          >
            {dialog.cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={() => dialog.resolve(true)}
            className={`py-2.5 rounded-xl text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              dialog.danger
                ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500'
                : 'bg-slate-900 hover:bg-slate-800 focus:ring-slate-500'
            }`}
          >
            {dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DialogHost() {
  const { toasts, confirm } = useSyncExternalStore(
    dialogStore.subscribe,
    dialogStore.getSnapshot
  );

  return (
    <>
      <div
        className="fixed bottom-20 inset-x-0 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none print:hidden"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const tone = TONES[t.tone] || TONES.info;
          const Icon = tone.icon;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto max-w-md w-full sm:w-auto flex items-center gap-2.5 text-sm pl-3 pr-2 py-2.5 rounded-xl shadow-lg ${tone.cls}`}
            >
              <Icon size={16} className="shrink-0" />
              <span className="flex-1">{t.message}</span>
              {t.action && (
                <button
                  onClick={() => {
                    t.action.onClick();
                    dismissToast(t.id);
                  }}
                  className="font-semibold underline underline-offset-2 px-1"
                >
                  {t.action.label}
                </button>
              )}
              <button
                onClick={() => dismissToast(t.id)}
                aria-label="Dismiss"
                className="p-1 opacity-70 hover:opacity-100"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
      {confirm && <ConfirmModal dialog={confirm} />}
    </>
  );
}
