// Bertopia student door only. build.mjs writes the real version over 2.5.138.
const VERSION = '2.5.138'
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
    // Stay waiting until the page posts {type:'skip'}. A fresh install (no active worker) still activates.
    await Promise.all(SHELL.map(async (url) => {
      try {
        const res = await fetch(url, { cache: 'reload' })
        if (res && res.ok) await cache.put(url, res)
      } catch (e) {}
    }))
  })())
})

self.addEventListener('message', (event) => {
  if (!event.data) return
  if (event.data.type === 'skip') self.skipWaiting()
  else if (event.data.type === 'ver' && event.source) event.source.postMessage({ type: 'ver', version: VERSION })
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

function isDoc(url) {
  return url.pathname === '/blocks' || url.pathname === '/blocks/' || url.pathname === '/blocks/index.html'
}

function shell(url) {
  if (url.pathname === '/blocks/app.js') return true
  if (url.pathname.startsWith('/blocks/assets/')) return true
  return isDoc(url)
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE)
  const hit = await cache.match(req)
  if (hit) return hit
  const res = await fetch(req)
  if (res && res.ok && res.type !== 'opaque') {
    try { await cache.put(req, res.clone()) } catch (e) {}
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

async function networkFirstDoc(req) {
  const cache = await caches.open(CACHE)
  const key = req.url.split('?')[0]
  let timer
  try {
    const res = await Promise.race([
      fetch(req.url, { cache: 'reload', credentials: 'same-origin' }),
      new Promise((_, rej) => { timer = setTimeout(() => rej(new Error('timeout')), 3000) }),
    ])
    clearTimeout(timer)
    if (res && res.ok && res.type !== 'opaque') {
      try { await cache.put(key, res.clone()) } catch (e) {}
      return res
    }
  } catch (e) {
    clearTimeout(timer)
  }
  const hit = await cache.match(req, { ignoreSearch: true }) || await cache.match(key)
  if (hit) return hit
  const loose = await caches.match(req, { ignoreSearch: true })
  if (loose) return loose
  return fetch(req)
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
  if (isDoc(url)) {
    event.respondWith(networkFirstDoc(req))
    return
  }
  event.respondWith(cacheFirst(req))
})
