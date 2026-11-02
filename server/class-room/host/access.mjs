// Cloudflare Access in front of the owner page (part 11, Diego Nov 1): when the owner reaches /owner through the
// tunnel, Cloudflare has already made them log in (email code) and adds a signed JWT (Cf-Access-Jwt-Assertion).
// The host checks that JWT itself — RS256 against the team's public keys, the app's AUD, the issuer, expiry and,
// when set, the email — so a request that merely claims the header (someone on the LAN, a proxy mistake) gets
// nothing. The PIN and the owner key are still asked on top. Pure where it can be: keys and time are injectable.
import { createPublicKey, verify as cryptoVerify } from 'node:crypto'

export const CERTS_TTL_MS = 60 * 60 * 1000
const b64 = (s) => Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64')
const json = (buf) => { try { return JSON.parse(buf.toString('utf8')) } catch (e) { return null } }

// Verify one token against a set of JWKs. Returns { ok, email, sub, exp } or { error }.
export function verifyAccessJwt(token, { keys, aud, issuer, email = '', nowSec = Math.floor(Date.now() / 1000) }) {
  if (typeof token !== 'string' || token.length > 8192) return { error: 'shape' }
  const parts = token.split('.')
  if (parts.length !== 3) return { error: 'shape' }
  const head = json(b64(parts[0])), body = json(b64(parts[1]))
  if (!head || !body || head.alg !== 'RS256' || typeof head.kid !== 'string') return { error: 'header' }
  const jwk = (keys || []).find((k) => k && k.kid === head.kid && k.kty === 'RSA')
  if (!jwk) return { error: 'kid' }
  let ok = false
  try { ok = cryptoVerify('RSA-SHA256', Buffer.from(parts[0] + '.' + parts[1]), createPublicKey({ key: jwk, format: 'jwk' }), b64(parts[2])) } catch (e) { ok = false }
  if (!ok) return { error: 'signature' }
  const auds = Array.isArray(body.aud) ? body.aud : [body.aud]
  if (!aud || !auds.includes(aud)) return { error: 'aud' }
  if (!issuer || body.iss !== issuer) return { error: 'iss' }
  if (!Number.isFinite(body.exp) || body.exp <= nowSec) return { error: 'expired' }
  if (Number.isFinite(body.nbf) && body.nbf > nowSec + 60) return { error: 'nbf' }
  if (email && String(body.email || '').toLowerCase() !== String(email).toLowerCase()) return { error: 'email' }
  return { ok: true, email: body.email || '', sub: body.sub || '', exp: body.exp }
}

// The live checker: fetches the team's certs (cached an hour, refetched once on an unknown kid) and verifies.
// cfg: { team, aud, email } — team is the Zero Trust team name (<team>.cloudflareaccess.com).
export function makeAccess(cfg, { fetchFn = globalThis.fetch, now = Date.now, certsUrl = '' } = {}) {
  let keys = [], at = 0, inflight = null
  const issuer = () => 'https://' + String(cfg.team || '').replace(/[^a-z0-9-]/gi, '') + '.cloudflareaccess.com'
  async function load(force) {
    if (!force && keys.length && now() - at < CERTS_TTL_MS) return keys
    if (!inflight) inflight = (async () => {
      try {
        const r = await fetchFn(certsUrl || issuer() + '/cdn-cgi/access/certs', { signal: AbortSignal.timeout(5000) })
        const j = r.ok ? await r.json() : null
        if (j && Array.isArray(j.keys)) { keys = j.keys; at = now() }
      } catch (e) {}
      inflight = null
      return keys
    })()
    return inflight
  }
  return {
    get on() { return !!(cfg.team && cfg.aud) },
    issuer,
    async check(token) {
      if (!cfg.team || !cfg.aud) return { error: 'off' }
      let r = verifyAccessJwt(token, { keys: await load(false), aud: cfg.aud, issuer: issuer(), email: cfg.email || '', nowSec: Math.floor(now() / 1000) })
      if (r.error === 'kid' || r.error === 'signature') r = verifyAccessJwt(token, { keys: await load(true), aud: cfg.aud, issuer: issuer(), email: cfg.email || '', nowSec: Math.floor(now() / 1000) })
      return r
    },
  }
}

// The token Cloudflare attaches: header first, else the cookie it sets for the browser.
export function accessToken(req) {
  const h = req.headers['cf-access-jwt-assertion']
  if (typeof h === 'string' && h) return h
  const m = /(?:^|;\s*)CF_Authorization=([^;]+)/.exec(String(req.headers.cookie || ''))
  return m ? m[1] : ''
}
