// Bertopia student door only. build.mjs writes the real version over 2.5.127.
const VERSION = '2.5.127'
const CACHE = 'bloxbert-' + VERSION
const SHELL = [
  '/blocks/app.js?v=' + VERSION,
  '/blocks/index.html',
  '/blocks/',
  '/blocks/assets/atlas.png',
  '/blocks/assets/atlas.json',
]

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE)
    // reload skips the HTTP cache, so a new version does not pin the previous index.html
    await Promise.all(SHELL.map(async (url) => {
      try {
        const res = await fetch(url, { cache: 'reload' })
        if (res && res.ok) await cache.put(url, res)
      } catch (e) {}
    }))
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter((k) => k.startsWith('bloxbert-') && k !== CACHE).map((k) => caches.delete(k)))
    await self.clients.claim()
  })())
})

function inBlocks(url) {
  return url.pathname === '/blocks' || url.pathname === '/blocks/' || url.pathname.startsWith('/blocks/')
}

function skip(url) {
  const p = url.pathname.toLowerCase()
  if (p.startsWith('/shared/')) return true
  if (p.endsWith('/sw.js')) return true
  if (p.includes('/auth') || p.includes('/save')) return true
  return false
}

function shell(url) {
  if (url.pathname === '/blocks/app.js') return true
  if (url.pathname.startsWith('/blocks/assets/')) return true
  return url.pathname === '/blocks' || url.pathname === '/blocks/' || url.pathname === '/blocks/index.html'
}

async function cacheFirst(req, ignoreSearch) {
  const cache = await caches.open(CACHE)
  const hit = await cache.match(req, ignoreSearch ? { ignoreSearch: true } : undefined)
  if (hit) return hit
  const res = await fetch(req)
  if (res && res.ok && res.type !== 'opaque') {
    try { await cache.put(ignoreSearch ? req.url.split('?')[0] : req, res.clone()) } catch (e) {}
  }
  return res
}

async function networkFirst(req) {
  try {
    return await fetch(req)
  } catch (e) {
    const hit = await caches.match(req)
    if (hit) return hit
    throw e
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  let url
  try { url = new URL(req.url) } catch (e) { return }
  if (url.origin !== self.location.origin || skip(url)) return
  if (!inBlocks(url)) {
    event.respondWith(networkFirst(req))
    return
  }
  if (!shell(url)) return
  const doc = url.pathname === '/blocks' || url.pathname === '/blocks/' || url.pathname === '/blocks/index.html'
  event.respondWith(cacheFirst(req, doc))
})
