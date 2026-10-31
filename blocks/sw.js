// Bertopia moved to /bertopia/. This kill-switch replaces the old /blocks/ service worker:
// it clears its caches, unregisters itself, and sends open tabs to the same page under /bertopia/.
self.addEventListener('install', () => { self.skipWaiting() })
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys()
      // Only Bertopia's caches: caches are shared by every app on this origin.
      await Promise.all(keys.filter((k) => k.indexOf('bloxbert-') === 0).map((k) => caches.delete(k)))
    } catch (e) {}
    try { await self.registration.unregister() } catch (e) {}
    try {
      const wins = await self.clients.matchAll({ type: 'window' })
      await Promise.all(wins.map((c) => {
        const u = new URL(c.url)
        u.pathname = u.pathname.replace(/^\/blocks(-test)?(\/|$)/, '/bertopia/')
        return c.navigate(u.href).catch(() => {})
      }))
    } catch (e) {}
  })())
})
