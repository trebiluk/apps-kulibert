// Our own item marks. Inline SVG, no borrowed art.
export const ICONS = {
  berry: '<svg viewBox="0 0 32 32"><circle cx="16" cy="18" r="8" fill="#e11d48"/><path d="M16 10c2-4 6-4 6-4" stroke="#14b8a6" fill="none" stroke-width="2"/></svg>',
  flour: '<svg viewBox="0 0 32 32"><rect x="8" y="8" width="16" height="18" rx="2" fill="#f8fafc" stroke="#0f766e"/><path d="M12 14h8M12 18h8" stroke="#94a3b8"/></svg>',
  sugar: '<svg viewBox="0 0 32 32"><rect x="9" y="7" width="14" height="18" fill="#fef3c7" stroke="#0f766e"/><circle cx="16" cy="16" r="2" fill="#fff"/></svg>',
  cupcake: '<svg viewBox="0 0 32 32"><path d="M8 18h16l-2 8H10z" fill="#7c3aed"/><circle cx="16" cy="14" r="6" fill="#fbcfe8"/></svg>',
  bread: '<svg viewBox="0 0 32 32"><ellipse cx="16" cy="18" rx="10" ry="6" fill="#d97706"/><path d="M8 16c2-6 14-6 16 0" fill="#fbbf24"/></svg>',
  cog: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="5" fill="none" stroke="#22d3ee" stroke-width="2"/><path d="M16 4v4M16 24v4M4 16h4M24 16h4M7 7l3 3M22 22l3 3M7 25l3-3M22 10l3-3" stroke="#14b8a6" stroke-width="2"/></svg>',
}
export function icon(name) { return ICONS[name] || ICONS.cog }
