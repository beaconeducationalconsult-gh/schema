/* Pulled into the generated service worker via workbox.importScripts (see vite.config.js).
 * Makes a tap on a class-reminder notification open the app instead of doing nothing. */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Only same-origin paths ("/", "/lesson/3") — never an arbitrary URL.
  const raw = event.notification.data && event.notification.data.url;
  const path = typeof raw === 'string' && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => new URL(c.url).origin === self.location.origin);
      if (open) {
        // Reuse the open window: bring it forward and let the app route itself.
        open.postMessage({ type: 'tc-navigate', url: path });
        return open.focus();
      }
      return self.clients.openWindow(path);
    })
  );
});
