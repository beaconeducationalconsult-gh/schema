// Tiny event-based store behind <DialogHost />. Import { toast, confirmDialog }
// anywhere (components or plain modules) instead of alert() / confirm().

let state = { toasts: [], confirm: null };
const listeners = new Set();
let nextId = 1;

function set(next) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

export const dialogStore = {
  subscribe(l) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getSnapshot: () => state,
};

export function dismissToast(id) {
  set({ toasts: state.toasts.filter((t) => t.id !== id) });
}

/** toast('Saved'), toast('Oops', { tone: 'error' }), toast('Deleted', { action: { label: 'Undo', onClick } }) */
export function toast(message, { tone = 'info', action = null, duration } = {}) {
  const id = nextId++;
  set({ toasts: [...state.toasts, { id, message, tone, action }] });
  const ms = duration ?? (action ? 6000 : tone === 'error' ? 6000 : 3500);
  setTimeout(() => dismissToast(id), ms);
  return id;
}

toast.success = (m, o) => toast(m, { ...o, tone: 'success' });
toast.error = (m, o) => toast(m, { ...o, tone: 'error' });

/** Promise-based replacement for window.confirm. Resolves true/false. */
export function confirmDialog({
  title = 'Are you sure?',
  message = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
} = {}) {
  return new Promise((resolve) => {
    // Only one at a time: cancel any pending one.
    state.confirm?.resolve(false);
    set({
      confirm: {
        title, message, confirmLabel, cancelLabel, danger,
        resolve: (v) => {
          set({ confirm: null });
          resolve(v);
        },
      },
    });
  });
}
