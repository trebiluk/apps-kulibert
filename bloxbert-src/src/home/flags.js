// The position frame's flags byte (part 7 'p' frames carry f 0..255; the school protocol allows it):
// bit 0 = flying, bits 1-3 = suit. Pure; shared by home.js (sender) and avatars.js (drawer).
export const SUIT_IDS = ['berty', 'clay', 'bearcat', 'grove', 'snow']
export const packFlags = (flying, suit) => (flying ? 1 : 0) | ((Math.max(0, SUIT_IDS.indexOf(suit)) & 7) << 1)
export const unpackFlags = (f) => { const n = Number(f) | 0; return { flying: !!(n & 1), suit: SUIT_IDS[(n >> 1) & 7] || 'berty' } }
// the suit this device chose (Settings → Clothes), read the way main.js saves it (LOOK_KEY); no main.js change needed
export function mySuit() { try { const s = JSON.parse(localStorage.getItem('bloxbert-look') || '{}').suit; return SUIT_IDS.includes(s) ? s : 'berty' } catch (e) { return 'berty' } }
