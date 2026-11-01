// World chat for the personal host (adults 18+). Pure. Regular server chat: ON in every preset (the owner can turn it
// off), everyone in the world hears every message, NO word filter. What stays, because it is spam and safety rather
// than content: at most 200 characters; a burst of 5 then 1 message a second per player; invisible direction and
// zero-width characters removed (they hide or flip text); owner mute. Messages are relayed, never written to disk or log.
export const CHAT_MAX = 200
export const CHAT_BURST = 5
export const CHAT_REFILL_MS = 1000

// -> { m } or { error }
export function cleanChat(raw) {
  if (typeof raw !== 'string') return { error: 'chat-empty' }
  const m = raw.normalize('NFC').replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩﻿]/g, '').replace(/\s+/g, ' ').trim()
  if (!m) return { error: 'chat-empty' }
  if ([...m].length > CHAT_MAX) return { error: 'chat-long' }
  return { m }
}

// A small bucket per player: CHAT_BURST messages at once, then one more each CHAT_REFILL_MS. Over it, the message is
// refused with how long to wait (no queueing, no silent drop).
export function makeChatGate({ now = Date.now } = {}) {
  const buckets = new Map()   // ref -> { n, at }
  return {
    check(ref) {
      const t = now()
      const b = buckets.get(ref) || { n: CHAT_BURST, at: t }
      b.n = Math.min(CHAT_BURST, b.n + (t - b.at) / CHAT_REFILL_MS); b.at = t
      if (b.n < 1) { buckets.set(ref, b); return { wait: Math.max(1, Math.ceil((1 - b.n) * CHAT_REFILL_MS / 1000)) } }
      b.n -= 1; buckets.set(ref, b); return null
    },
    forget(ref) { buckets.delete(ref) },
    sweep() { const t = now(); for (const [k, b] of buckets) if (t - b.at > 60000) buckets.delete(k) },
    get size() { return buckets.size },
  }
}
