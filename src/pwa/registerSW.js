import { registerSW } from 'virtual:pwa-register';

export function initPWA() {
  if (!('serviceWorker' in navigator)) return;

  const updateSW = registerSW({
    onNeedRefresh() {
      window.__pwaNeedRefresh = true;
      window.dispatchEvent(new Event('pwa:need-refresh'));
    },
    onOfflineReady() {
      window.__pwaOfflineReady = true;
      window.dispatchEvent(new Event('pwa:offline-ready'));
    },
    onRegisteredSW(swUrl, registration) {
      if (registration) {
        setInterval(() => {
          registration.update().catch(() => {});
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(err) {
      console.warn('[pwa] register error', err);
    },
  });

  window.__pwaUpdate = () => updateSW(true);
}
