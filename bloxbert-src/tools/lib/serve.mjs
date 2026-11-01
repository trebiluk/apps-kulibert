// Static server for the browser checks: serves the repo root (so /blocks-test/ and /bertopia/ are the built bundles),
// gzip for text, no cache. Same shape the other checks build inline (archive-check and others).
import { createServer } from 'http'
import { readFile } from 'fs/promises'
import { gzipSync } from 'zlib'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.webp': 'image/webp', '.woff2': 'font/woff2' }

export async function serveRepo(port) {
  const server = createServer(async (req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    if (p.endsWith('/')) p += 'index.html'
    const f = path.join(root, p)
    if (!f.startsWith(root)) { res.writeHead(403); return res.end() }
    try {
      let b = await readFile(f)
      const ext = path.extname(f)
      const h = { 'content-type': types[ext] || 'application/octet-stream', 'cache-control': 'no-store' }
      if (/gzip/.test(req.headers['accept-encoding'] || '') && /\.(html|js|json|css|svg|txt)$/.test(ext)) { b = gzipSync(b); h['content-encoding'] = 'gzip' }
      h['content-length'] = b.length
      res.writeHead(200, h)
      res.end(b)
    } catch { res.writeHead(404); res.end('nf') }
  })
  const base = 'http://127.0.0.1:' + port
  try {
    await new Promise((r, j) => { server.once('error', j); server.listen(port, '127.0.0.1', r) })
  } catch (e) {
    // A server is already on this port (someone started one by hand, as the checks used to need): use it.
    if (e && e.code === 'EADDRINUSE') return { base, reused: true, close: async () => {} }
    throw e
  }
  return { base, close: () => new Promise((r) => server.close(r)) }
}
