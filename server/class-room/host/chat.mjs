// Typed chat for the personal host (docs/bertopia/HOME-HOST.md §6). Pure. OFF unless the ruleset turns
// chat.typed on. When on: plain text, at most 200 characters, 1 message per 2 s per player, word filter, owner
// mute. Messages are relayed to the people in the world and never written to disk or the log.
import { textOk } from './words.mjs'
export const CHAT_MAX = 200
export const CHAT_GAP_MS = 2000

// -> { m } or { error }. Control characters and direction overrides are removed so nobody can flip or hide text.
export function cleanChat(raw) {
  if (typeof raw !== 'string') return { error: 'chat-empty' }
  const m = raw.normalize('NFC').replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩﻿]/g, '').replace(/\s+/g, ' ').trim()
  if (!m) return { error: 'chat-empty' }
  if ([...m].length > CHAT_MAX) return { error: 'chat-long' }
  if (!textOk(m)) return { error: 'chat-filtered' }
  return { m }
}

// One gap per player: a message inside the gap is refused with how long to wait (no queueing, no silent drop).
export function makeChatGate({ now = Date.now } = {}) {
  const last = new Map()
  return {
    check(ref) { const t = now(), prev = last.get(ref); if (prev !== undefined && t - prev < CHAT_GAP_MS) return { wait: Math.ceil((CHAT_GAP_MS - (t - prev)) / 1000) }; last.set(ref, t); return null },
    forget(ref) { last.delete(ref) },
    sweep() { const t = now(); for (const [k, v] of last) if (t - v > 60000) last.delete(k) },
    get size() { return last.size },
  }
}
