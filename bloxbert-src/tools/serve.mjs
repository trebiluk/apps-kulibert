// Tiny static server with gzip, for local measurement only.
import http from 'http'; import { readFile } from 'fs/promises'; import { gzipSync } from 'zlib'; import path from 'path'
const root = path.resolve(process.argv[2] || 'dist'); const port = +(process.argv[3] || 8870)
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.css': 'text/css', '.txt': 'text/plain', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
http.createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html'
  const f = path.join(root, p); if (!f.startsWith(root)) { res.writeHead(403); return res.end() }
  try {
    let b = await readFile(f); const ext = path.extname(f); const h = { 'content-type': types[ext] || 'application/octet-stream', 'cache-control': 'no-store' }
    if (/gzip/.test(req.headers['accept-encoding'] || '') && /\.(html|js|json|css|svg|txt)$/.test(ext)) { b = gzipSync(b, { level: 9 }); h['content-encoding'] = 'gzip' }
    h['content-length'] = b.length; res.writeHead(200, h); res.end(b)
  } catch { res.writeHead(404); res.end('nf') }
}).listen(port, '127.0.0.1', () => console.log('serving', root, 'on', port))
