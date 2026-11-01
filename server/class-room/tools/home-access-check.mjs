// Part 11 check: the owner page through the tunnel behind Cloudflare Access (host/access.mjs + the owner gate).
// Pure half: JWT verification with a key pair made here. Live half: a host with a fake "team" whose certs are served
// by this script, a request shaped like the tunnel's (loopback + cf-connecting-ip + tunnel Host) with and without
// a good JWT.   node --no-warnings tools/home-access-check.mjs
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import http from 'node:http'
import { generateKeyPairSync, sign } from 'node:crypto'
import { verifyAccessJwt, makeAccess, accessToken } from '../host/access.mjs'

let fails = 0
const eq = (ok, msg) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + msg); if (!ok) fails++ }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const b64u = (b) => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const { publicKey: otherPub, privateKey: otherPriv } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'kid-1', alg: 'RS256', use: 'sig' }
const jwk2 = { ...otherPub.export({ format: 'jwk' }), kid: 'kid-2', alg: 'RS256', use: 'sig' }
const AUD = 'a'.repeat(64), ISS = 'https://topia-test.cloudflareaccess.com', NOW = 1_800_000_000
const mint = (claims, { key = privateKey, kid = 'kid-1', alg = 'RS256' } = {}) => {
  const h = b64u(JSON.stringify({ alg, kid, typ: 'JWT' })), b = b64u(JSON.stringify({ aud: [AUD], iss: ISS, exp: NOW + 600, iat: NOW, email: 'diego@example.com', sub: 'u1', ...claims }))
  return h + '.' + b + '.' + b64u(sign('RSA-SHA256', Buffer.from(h + '.' + b), key))
}
const V = (tok, extra = {}) => verifyAccessJwt(tok, { keys: [jwk], aud: AUD, issuer: ISS, nowSec: NOW, ...extra })

// ---- pure
eq(V(mint({})).ok && V(mint({})).email === 'diego@example.com', 'jwt: a token signed by the team key for this AUD and issuer passes')
eq(V(mint({}, { key: otherPriv })).error === 'signature' && V(mint({}, { kid: 'kid-9' })).error === 'kid', 'jwt: another key is a bad signature; an unknown kid is refused')
eq(V(mint({ aud: ['b'.repeat(64)] })).error === 'aud' && V(mint({ iss: 'https://evil.cloudflareaccess.com' })).error === 'iss', 'jwt: wrong AUD or issuer is refused')
eq(V(mint({ exp: NOW - 1 })).error === 'expired' && V(mint({ nbf: NOW + 3600 })).error === 'nbf', 'jwt: expired or not-yet-valid is refused')
eq(V(mint({}), { email: 'Diego@Example.com' }).ok && V(mint({ email: 'other@example.com' }), { email: 'diego@example.com' }).error === 'email', 'jwt: the email pin matches any case and refuses another address')
eq(V('nope').error === 'shape' && V('a.b.c').error === 'header' && V(mint({}, { alg: 'none' })).error === 'header' && V('x'.repeat(9000)).error === 'shape', 'jwt: junk, alg none and oversized tokens are refused')
eq(accessToken({ headers: { 'cf-access-jwt-assertion': 'H' } }) === 'H' && accessToken({ headers: { cookie: 'a=1; CF_Authorization=C; b=2' } }) === 'C' && accessToken({ headers: {} }) === '', 'token: header first, then the CF_Authorization cookie')

// ---- live: a certs server standing in for <team>.cloudflareaccess.com
let certsHits = 0, served = [jwk]
const certs = http.createServer((req, res) => { certsHits++; res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ keys: served })) })
await new Promise((r) => certs.listen(0, '127.0.0.1', r))
const CERTS = 'http://127.0.0.1:' + certs.address().port
{
  let t = NOW * 1000
  const acc = makeAccess({ team: 'topia-test', aud: AUD, email: 'diego@example.com' }, { fetchFn: (u) => fetch(CERTS + new URL(u).pathname), now: () => t })
  eq(acc.on && acc.issuer() === ISS && (await acc.check(mint({}))).ok && certsHits === 1 && (await acc.check(mint({}))).ok && certsHits === 1, 'live: certs are fetched once and cached (' + certsHits + ' fetch)')
  served = [jwk, jwk2]
  eq((await acc.check(mint({}, { key: otherPriv, kid: 'kid-2' }))).ok && certsHits === 2, 'live: an unknown kid refetches the certs once (a rotated key works)')
  eq((await acc.check(mint({ email: 'x@example.com' }))).error === 'email' && (await makeAccess({ team: '', aud: '' }).check(mint({}))).error === 'off', 'live: the email pin holds; with no team/AUD the checker is off')
}

// ---- live host: the owner gate
const PORT = 19780 + (process.pid % 100), DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'topia-acc-')), A = 'http://127.0.0.1:' + PORT
let child = null, log = ''
try {
  // the host must reach "https://topia-test.cloudflareaccess.com/cdn-cgi/access/certs": point it at our certs server
  fs.writeFileSync(path.join(DATA, 'home.json'), JSON.stringify({ access: { team: 'topia-test', aud: AUD, email: 'diego@example.com' }, tunnelHost: 'adultopia.example.net' }))
  child = spawn(process.execPath, ['--no-warnings', '--import', './host/register.mjs', 'host/home.mjs', '--port', String(PORT), '--data', DATA], { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, BT_ACCESS_CERTS: CERTS } })
  child.stdout.on('data', (d) => (log += d)); child.stderr.on('data', (d) => (log += d))
  for (let i = 0; i < 100 && !/owner page/.test(log); i++) await sleep(50)
  const key = /k=([0-9a-f]+)/.exec(log)[1]
  const tunnel = (p, h = {}, init = {}) => fetch(A + p, { ...init, headers: { 'cf-connecting-ip': '198.51.100.7', host: 'adultopia.example.net', ...h, ...(init.headers || {}) } })
  const fresh = () => { const hh = b64u(JSON.stringify({ alg: 'RS256', kid: 'kid-1', typ: 'JWT' })), bb = b64u(JSON.stringify({ aud: [AUD], iss: ISS, exp: Math.floor(Date.now() / 1000) + 600, iat: Math.floor(Date.now() / 1000), email: 'diego@example.com', sub: 'u1' })); return hh + '.' + bb + '.' + b64u(sign('RSA-SHA256', Buffer.from(hh + '.' + bb), privateKey)) }
  eq((await tunnel('/owner?k=' + key)).status === 403 && (await tunnel('/owner/state', {}, { method: 'POST', body: '{}' })).status === 403, 'gate: through the tunnel without a JWT the owner page and API are refused')
  eq((await tunnel('/owner?k=' + key, { 'cf-access-jwt-assertion': 'garbage' })).status === 403 && /owner page refused through the tunnel \(shape\)/.test(log), 'gate: a junk JWT is refused and the feed says why')
  const good = fresh()
  const pageR = await tunnel('/owner?k=' + key, { 'cf-access-jwt-assertion': good })
  eq(pageR.status === 200 && /Bertopia Home/.test(await pageR.text()), 'gate: with a good JWT the owner page is served through the tunnel')
  const pin = await (await tunnel('/owner/pin', { 'content-type': 'application/json', cookie: 'CF_Authorization=' + good }, { method: 'POST', body: JSON.stringify({ key, pin: '246810' }) })).json()
  eq(!!pin.token, 'gate: the PIN exchange works through the tunnel with the Access cookie (PIN still required)')
  const st = await (await tunnel('/owner/state', { 'content-type': 'application/json', 'cf-access-jwt-assertion': good, 'x-owner': pin.token }, { method: 'POST', body: '{}' })).json()
  eq(st.access && st.access.on && st.access.remote === true && st.tunnel === 'https://adultopia.example.net/', 'gate: state through the tunnel says remote; Access on ' + JSON.stringify({ a: st.access, t: st.tunnel, e: st.error }))
  const chg = await (await tunnel('/owner/access', { 'content-type': 'application/json', 'cf-access-jwt-assertion': good, 'x-owner': pin.token }, { method: 'POST', body: JSON.stringify({ team: 'evil' }) })).json()
  eq(chg.error === 'host only' && JSON.parse(fs.readFileSync(path.join(DATA, 'home.json'), 'utf8')).access.team === 'topia-test', 'gate: the Access settings cannot be changed from the remote side ' + JSON.stringify(chg))
  const localSt = await (await fetch(A + '/owner/state', { method: 'POST', headers: { 'content-type': 'application/json', 'x-owner': pin.token }, body: '{}' })).json()
  eq(localSt.access.remote === false, 'gate: the same token from the host PC reads as local')
  const lan = await fetch(A + '/owner/state', { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.0.0.5', 'cf-access-jwt-assertion': good, 'x-owner': pin.token }, body: '{}' })
  eq(lan.status === 403, 'gate: a forwarded LAN request with a copied JWT (not the tunnel) is still refused')
  const wrongEmail = (() => { const hh = b64u(JSON.stringify({ alg: 'RS256', kid: 'kid-1', typ: 'JWT' })), bb = b64u(JSON.stringify({ aud: [AUD], iss: ISS, exp: Math.floor(Date.now() / 1000) + 600, email: 'someone@example.com', sub: 'u2' })); return hh + '.' + bb + '.' + b64u(sign('RSA-SHA256', Buffer.from(hh + '.' + bb), privateKey)) })()
  eq((await tunnel('/owner?k=' + key, { 'cf-access-jwt-assertion': wrongEmail })).status === 403 && /\(email\)/.test(log), 'gate: a valid Access login for another email is refused')
  eq(!log.includes(good.slice(-40)) && log.split(key).length === 2, 'secrets: the JWT is never in the log; the owner key only once (the start-up owner page URL)')
} catch (e) {
  eq(false, 'live run threw: ' + (e && e.message ? e.message.split('\n')[0] : e) + '\n' + log.split('\n').slice(-6).join('\n'))
} finally {
  try { await fetch(A + '/owner/stop', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }) } catch (e) {}
  await sleep(300); if (child && child.exitCode === null) child.kill()
  certs.close(); fs.rmSync(DATA, { recursive: true, force: true })
}
console.log(fails ? `home-access-check: ${fails} FAIL` : 'home-access-check: all PASS')
process.exit(fails ? 1 : 0)
