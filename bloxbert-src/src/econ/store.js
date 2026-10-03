import { pays, sells } from '../data/econ.js'
export function quoteSell(item, sold, dial, cfg) { return pays(item, sold, dial, cfg) }
export function quoteBuy(item, dial, cfg) { return sells(item, dial, cfg) }
export function canSellToday(sold, cap) { return (sold || 0) < cap }
