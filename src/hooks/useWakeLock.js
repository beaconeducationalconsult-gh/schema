import { useEffect } from 'react';

/**
 * Keeps the screen awake while `active` is true (Screen Wake Lock API).
 * Silently does nothing on browsers that don't support it. The lock is
 * released by the browser when the tab is hidden, so re-acquire on return.
 */
export function useWakeLock(active = true) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return undefined;

    let lock = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        const l = await navigator.wakeLock.request('screen');
        if (cancelled) l.release().catch(() => {});
        else lock = l;
      } catch {
        /* denied (e.g. low battery) – not critical */
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') acquire();
    };

    acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      lock?.release().catch(() => {});
    };
  }, [active]);
}
