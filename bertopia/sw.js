// Bertopia kill-switch worker (2.5.584). build.mjs writes the real version over 2.5.563.
// No fetch handler and no caching: it clears every Bertopia cache and unregisters itself.
// Only bloxbert-* caches are cleared, because every app on this origin shares Cache Storage.
const VERSION = '2.5.563'
const CACHE = 'bloxbert-off-' + VERSION // never opened; the name changes each version so the browser sees a new worker

self.addEventListener('install', () => { self.skipWaiting() })

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'ver' && event.source) event.source.postMessage({ type: 'ver', version: VERSION })
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k.indexOf('bloxbert-') === 0 && k !== CACHE).map((k) => caches.delete(k)))
    } catch (e) {}
    try { await self.registration.unregister() } catch (e) {}
  })())
})
