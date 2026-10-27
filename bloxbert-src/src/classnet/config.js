export const CLASS_SERVER = false
export const CLASS_WS_URL = ''
export const CLASS_TICKET_URL = ''
export const CLASS_STATUS_URL = ''

export function safeUrl(u, scheme) {
  if (typeof u !== 'string' || !u) return false
  let url
  try { url = new URL(u) } catch (e) { return false }
  if (url.protocol !== scheme) return false
  const host = url.hostname
  if (host !== 'kulibert.net' && !host.endsWith('.kulibert.net')) return false
  if (url.username || url.password) return false
  if (url.search || url.hash) return false
  return true
}

function devOn(store) {
  try {
    return !!(store && store.getItem && store.getItem('bt-class-dev') === '1')
  } catch (e) {
    return false
  }
}

export function pick(cfg, loc, store) {
  try {
    const flag = !!(cfg && cfg.flag === true)
    const ws = cfg && cfg.ws
    const ticket = cfg && cfg.ticket
    const status = cfg && cfg.status
    if (flag && safeUrl(ws, 'wss:') && safeUrl(ticket, 'https:') && safeUrl(status, 'https:')) {
      return { ws: ws, ticket: ticket, status: status }
    }
    const host = loc && loc.hostname
    if ((host === 'localhost' || host === '127.0.0.1') && devOn(store)) {
      return {
        ws: 'ws://localhost:8787/rt/ws',
        ticket: 'http://localhost:8788/ticket',
        status: 'http://localhost:8788/status',
      }
    }
    return null
  } catch (e) {
    return null
  }
}

export function endpoints() {
  try {
    return pick(
      { flag: CLASS_SERVER, ws: CLASS_WS_URL, ticket: CLASS_TICKET_URL, status: CLASS_STATUS_URL },
      location,
      localStorage
    )
  } catch (e) {
    return null
  }
}
