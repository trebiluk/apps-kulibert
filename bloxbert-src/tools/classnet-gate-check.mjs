const calls = []
function stub(name) {
  return function () {
    calls.push(name)
    throw new Error(name)
  }
}
globalThis.fetch = stub('fetch')
globalThis.WebSocket = stub('WebSocket')
globalThis.XMLHttpRequest = stub('XMLHttpRequest')
globalThis.EventSource = stub('EventSource')
if (!globalThis.navigator) globalThis.navigator = {}
globalThis.navigator.sendBeacon = stub('sendBeacon')

const { CLASS_SERVER, pick, safeUrl, endpoints } = await import('../src/classnet/config.js')

function fail(msg) {
  console.error('FAIL', msg)
  process.exit(1)
}
function eq(cond, msg) {
  if (!cond) fail(msg)
}

const loc = (hostname) => ({ hostname })
const store = (val) => ({ getItem: () => val })
const off = { flag: CLASS_SERVER, ws: '', ticket: '', status: '' }

eq(pick(off, loc('apps.kulibert.net'), store(null)) === null, 'apps default is null')
eq(pick(off, loc('localhost'), store(null)) === null, 'localhost without the dev flag is null')
eq(pick(off, loc('apps.kulibert.net'), store('1')) === null, 'dev flag is ignored on apps.kulibert.net')

const local = pick(off, loc('localhost'), store('1'))
eq(local && local.ws === 'ws://localhost:8787/rt/ws', 'localhost ws')
eq(local && local.ticket === 'http://localhost:8788/ticket', 'localhost ticket')
eq(local && local.status === 'http://localhost:8788/status', 'localhost status')
const loop = pick(off, loc('127.0.0.1'), store('1'))
eq(loop && loop.ws === 'ws://localhost:8787/rt/ws', '127.0.0.1 dev flag')

const good = {
  flag: true,
  ws: 'wss://class.kulibert.net/rt/ws',
  ticket: 'https://class.kulibert.net/ticket',
  status: 'https://class.kulibert.net/status',
}
const on = pick(good, loc('apps.kulibert.net'), store(null))
eq(on && on.ws === good.ws && on.ticket === good.ticket && on.status === good.status, 'flag on returns the urls')
eq(pick({ ...good, flag: false }, loc('apps.kulibert.net'), store(null)) === null, 'flag off returns null')

eq(safeUrl('ws://class.kulibert.net/rt/ws', 'wss:') === false, 'ws scheme refused')
eq(safeUrl('http://class.kulibert.net/ticket', 'https:') === false, 'http ticket refused')
eq(safeUrl('wss://evil.example/rt/ws', 'wss:') === false, 'other host refused')
eq(safeUrl('wss://class.kulibert.net.evil.example/', 'wss:') === false, 'suffix host refused')
eq(safeUrl('wss://class.kulibert.net/rt/ws?x=1', 'wss:') === false, 'query refused')
eq(safeUrl('wss://user:pw@rt.kulibert.net/', 'wss:') === false, 'userinfo refused')
eq(safeUrl(1, 'wss:') === false, 'non-string refused')
eq(safeUrl('', 'wss:') === false, 'empty refused')
eq(endpoints() === null, 'real defaults stay null')
eq(calls.length === 0, 'stubs were not called')
console.log('classnet gate ok')
