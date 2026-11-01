// Join tokens. A token says "this kid (opaque ref) may join this room (opaque id)
// under this alias, until this time". It is signed with HMAC-SHA256 using a
// secret that only TechWorks (the issuer) and this Worker know.
//
//   token = base64url(JSON claims) + "." + base64url(HMAC-SHA256(secret, first part))
//   claims = { v: 1, ref, room, alias, exp, jti, role, amr?, cfg }
//     ref   opaque kid id (never the alias, never an email)
//     room  opaque room id. Staff create rooms; a kid ticket can only name a room that TechWorks put in it.
//     alias the Hub alias (picked or generated, never typed)
//     exp   unix seconds. Kid tickets live at most MAX_TOKEN_TTL_SEC (120 s), staff tickets at most 300 s.
//     jti   opaque one-time id. The room refuses a ticket it has already seen (replay).
//     role  "kid" | "teacher" | "admin". The role is bound to this room by the same signature.
//     amr   staff only: must include "passkey" (TechWorks sets it only after a staff passkey sign-in)
//     cfg   REQUIRED: one of the 7 world config ids (solvay semester period game loot contest seed)
//   Any other claim name is refused, so nothing like a name or email can ride along.
//
// The real name of a student is never in a token. `ref` is an opaque random id,
// not the alias and never an email. Verification fails closed on anything odd.
//
// signToken() is for tests and for the TechWorks side. The Worker only calls verifyToken().

import { cleanAlias, isOpaqueId, isStaff, isConfigId, ROLES, MAX_TOKEN_TTL_SEC, MAX_STAFF_TOKEN_TTL_SEC } from './protocol.js'

const enc = new TextEncoder()
const dec = new TextDecoder()
const SKEW_SEC = 30
const CLAIM_KEYS = new Set(['v', 'ref', 'room', 'world', 'grp', 'bld', 'alias', 'exp', 'jti', 'role', 'amr', 'cfg', 'iss'])
// iss: who issued the ticket. Absent = TechWorks (school). The personal host issues 'home'. A verifier states which
// issuer it accepts; the school Worker (default) accepts only school tickets, so a home ticket is refused there.

function toB64u(bytes) {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromB64u(str) {
  if (!/^[A-Za-z0-9_-]*$/.test(str)) throw new Error('b64')
  const pad = '='.repeat((4 - (str.length % 4)) % 4)
  const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/') + pad)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function hmacKey(secret, usages) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, usages)
}

export async function signToken(claims, secret) {
  const payload = toB64u(enc.encode(JSON.stringify(claims)))
  const key = await hmacKey(secret, ['sign'])
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(payload)))
  return payload + '.' + toB64u(sig)
}

const bad = (why) => ({ ok: false, why })

// secrets: array of strings (current first, previous second, so a secret can be rotated).
// Returns { ok: true, claims: { ref, room, alias, jti, exp, role, cfg } } or { ok: false, why }.
export async function verifyToken(token, secrets, nowSec = Math.floor(Date.now() / 1000), { issuer = undefined } = {}) {
  if (typeof token !== 'string' || token.length < 10 || token.length > 800) return bad('shape')
  const parts = token.split('.')
  if (parts.length !== 2) return bad('shape')

  let sig
  try { sig = fromB64u(parts[1]) } catch (e) { return bad('b64') }

  const list = (secrets || []).filter((s) => typeof s === 'string' && s.length >= 16)
  if (!list.length) return bad('no-secret')
  let verified = false
  for (const s of list) {
    const key = await hmacKey(s, ['verify'])
    if (await crypto.subtle.verify('HMAC', key, sig, enc.encode(parts[0]))) { verified = true; break }
  }
  if (!verified) return bad('sig')

  let c
  try { c = JSON.parse(dec.decode(fromB64u(parts[0]))) } catch (e) { return bad('json') }
  if (!c || typeof c !== 'object' || Array.isArray(c) || c.v !== 1) return bad('version')
  for (const k of Object.keys(c)) if (!CLAIM_KEYS.has(k)) return bad('claims')
  // One of room (a single 30-kid room) or world (TechWorks names the world; the hub picks the room).
  if ((c.room === undefined) === (c.world === undefined)) return bad('id')
  if (!isOpaqueId(c.ref) || !isOpaqueId(c.room ?? c.world) || !isOpaqueId(c.jti)) return bad('id')
  if (c.grp !== undefined && !isOpaqueId(c.grp)) return bad('id')
  if (c.bld !== undefined && c.bld !== 's' && c.bld !== 't') return bad('bld')
  if (c.iss !== undefined && (typeof c.iss !== 'string' || !/^[a-z]{2,12}$/.test(c.iss))) return bad('iss')
  if (c.iss !== issuer) return bad('issuer')                 // a school verifier gets undefined; the home door passes 'home'
  if (!isConfigId(c.cfg)) return bad('cfg')
  if (!ROLES.includes(c.role)) return bad('role')
  const staff = isStaff(c.role)
  if (staff) {
    if (!Array.isArray(c.amr) || c.amr.length > 4 || !c.amr.includes('passkey')) return bad('amr')
  } else if (c.amr !== undefined) return bad('amr')
  const alias = cleanAlias(c.alias)
  if (!alias) return bad('alias')
  if (!Number.isInteger(c.exp)) return bad('exp')
  if (c.exp <= nowSec - SKEW_SEC) return bad('expired')
  const maxTtl = staff ? MAX_STAFF_TOKEN_TTL_SEC : MAX_TOKEN_TTL_SEC
  if (c.exp > nowSec + maxTtl + SKEW_SEC) return bad('ttl')

  return { ok: true, claims: { ref: c.ref, room: c.room ?? null, world: c.world ?? null, grp: c.grp ?? null, bld: c.bld ?? 's', alias, jti: c.jti, exp: c.exp, role: c.role, cfg: c.cfg, ...(c.iss !== undefined ? { iss: c.iss } : {}) } }
}
