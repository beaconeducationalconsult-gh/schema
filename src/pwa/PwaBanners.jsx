import React, { useEffect, useState } from 'react';

export default function PwaBanners() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [installEvent, setInstallEvent] = useState(null);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const [iosHintSeen, setIosHintSeen] = useState(
    () => localStorage.getItem('ios-install-hint-seen') === '1'
  );

  useEffect(() => {
    const onRefresh = () => setNeedRefresh(true);
    const onReady = () => {
      if (sessionStorage.getItem('pwa-offline-ready-dismissed') !== '1') {
        setOfflineReady(true);
      }
    };

    window.addEventListener('pwa:need-refresh', onRefresh);
    window.addEventListener('pwa:offline-ready', onReady);

    if (window.__pwaNeedRefresh) setNeedRefresh(true);
    if (window.__pwaOfflineReady && sessionStorage.getItem('pwa-offline-ready-dismissed') !== '1') {
      setOfflineReady(true);
    }

    return () => {
      window.removeEventListener('pwa:need-refresh', onRefresh);
      window.removeEventListener('pwa:offline-ready', onReady);
    };
  }, []);

  useEffect(() => {
    const on  = () => setIsOffline(false);
    const off = () => setIsOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallEvent(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!installEvent) return;
    installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === 'accepted') setInstallEvent(null);
  };

  return (
    <div className="fixed inset-x-0 bottom-16 z-40 flex flex-col gap-2 p-3 pointer-events-none print:hidden">
      {isOffline && (
        <Banner tone="amber">
          <span className="flex-1">
            ⚠️ You're offline — everything still works. Changes are saved on this device.
          </span>
        </Banner>
      )}

      {needRefresh && (
        <Banner tone="slate">
          <span className="flex-1">A new version is ready.</span>
          <button
            onClick={() => window.__pwaUpdate?.()}
            className="ml-3 px-3 py-1.5 rounded-lg bg-surface text-slate-900 text-xs font-medium"
          >
            Reload
          </button>
          <button
            onClick={() => setNeedRefresh(false)}
            className="ml-2 text-xs opacity-70"
          >
            Later
          </button>
        </Banner>
      )}

      {offlineReady && !needRefresh && (
        <Banner tone="emerald">
          <span className="flex-1">✅ Ready to use offline.</span>
          <button
            onClick={() => {
              sessionStorage.setItem('pwa-offline-ready-dismissed', '1');
              setOfflineReady(false);
            }}
            className="ml-3 text-xs opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </Banner>
      )}

      {isIOS && !isStandalone && !iosHintSeen && (
        <Banner tone="blue">
          <span className="flex-1">
            Install: tap <b>Share</b> → <b>Add to Home Screen</b>.
          </span>
          <button
            onClick={() => {
              localStorage.setItem('ios-install-hint-seen', '1');
              setIosHintSeen(true);
            }}
            className="ml-3 text-xs opacity-70"
          >
            Got it
          </button>
        </Banner>
      )}

      {installEvent && !isStandalone && (
        <Banner tone="blue">
          <span className="flex-1">Install Teaching Companion for home-screen access.</span>
          <button
            onClick={install}
            className="ml-3 px-3 py-1.5 rounded-lg bg-surface text-slate-900 text-xs font-medium"
          >
            Install
          </button>
          <button
            onClick={() => setInstallEvent(null)}
            className="ml-2 text-xs opacity-70"
          >
            Not now
          </button>
        </Banner>
      )}
    </div>
  );
}

function Banner({ tone, children }) {
  const tones = {
    amber:   'bg-amber-100 text-amber-900 border-amber-200',
    emerald: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    slate:   'bg-primary text-on-primary border-slate-800',
    blue:    'bg-blue-600 text-white border-blue-700',
  };
  return (
    <div
      className={`pointer-events-auto mx-auto max-w-2xl w-full flex items-center
                  px-3 py-2 rounded-xl border shadow-lg text-sm ${tones[tone]}`}
    >
      {children}
    </div>
  );
}
