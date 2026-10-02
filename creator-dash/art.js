// Generated placeholder art (inline SVG). No photos of people, no outside images.
(function () {
  const P = ['#14B8A6', '#22D3EE', '#3B82F6', '#0EA5E9', '#5EEAD4', '#93C5FD']
  function rnd(seed) { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280) }
  function wrap(w, h, inner, bg) { return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true"><rect width="${w}" height="${h}" fill="${bg}"/>${inner}</svg>` }
  const kinds = {
    beat(r, w, h) { // step grid + waveform
      let s = ''; const cols = 16, rows = 4, cw = (w - 32) / cols, top = h * 0.42
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const on = r() < 0.38; s += `<rect x="${16 + x * cw + 1}" y="${top + y * 22}" width="${cw - 3}" height="18" rx="3" fill="${on ? P[y % 3] : '#1b2740'}"/>`
      }
      let d = `M16 ${h * 0.22}`; for (let x = 16; x <= w - 16; x += 6) d += ` L${x} ${h * 0.22 + Math.sin(x / 9 + r() * 2) * (8 + r() * 16)}`
      return s + `<path d="${d}" fill="none" stroke="#22D3EE" stroke-width="2"/>`
    },
    voxel(r, w, h) { // isometric blocks
      let s = ''; const c = 18, ox = w / 2, oy = h * 0.3
      const cube = (i, j, k, col) => {
        const x = ox + (i - j) * c, y = oy + (i + j) * c * 0.5 - k * c
        return `<path d="M${x} ${y} l${c} ${c / 2} l-${c} ${c / 2} l-${c} -${c / 2}z" fill="${col}"/><path d="M${x - c} ${y + c / 2} l${c} ${c / 2} v${c} l-${c} -${c / 2}z" fill="${col}" opacity=".7"/><path d="M${x + c} ${y + c / 2} l-${c} ${c / 2} v${c} l${c} -${c / 2}z" fill="${col}" opacity=".5"/>`
      }
      for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) { const hgt = 1 + Math.floor(r() * 3); for (let k = 0; k < hgt; k++) s += cube(i, j, k, k === hgt - 1 ? P[(i + j) % 4] : '#2b3a57') }
      return s
    },
    cad(r, w, h) { // wireframe part with dims
      const x = w * 0.18, y = h * 0.25, bw = w * 0.64, bh = h * 0.45, a = 18 + r() * 20
      return `<g fill="none" stroke="#22D3EE" stroke-width="2"><path d="M${x} ${y + bh} L${x + bw * 0.25} ${y} L${x + bw} ${y} L${x + bw * 0.75} ${y + bh}Z"/><path d="M${x + bw * 0.25} ${y} l${a} -${a}"/><path d="M${x + bw} ${y} l${a} -${a}"/><path d="M${x + bw * 0.75} ${y + bh} l${a} -${a}"/></g><g stroke="#3B82F6" stroke-dasharray="4 4"><path d="M${x} ${y + bh + 18} H${x + bw * 0.75}"/></g><text x="${x + bw * 0.3}" y="${y + bh + 34}" fill="#93C5FD" font-size="12" font-family="ui-monospace,monospace">${(60 + r() * 60).toFixed(1)} mm</text>`
    },
    plan(r, w, h) { // floor plan
      let s = `<rect x="20" y="20" width="${w - 40}" height="${h - 40}" fill="none" stroke="#5EEAD4" stroke-width="4"/>`
      const vx = 20 + (w - 40) * (0.35 + r() * 0.3), hy = 20 + (h - 40) * (0.4 + r() * 0.2)
      s += `<path d="M${vx} 20 V${hy} M20 ${hy} H${w - 20}" stroke="#5EEAD4" stroke-width="3"/>`
      s += `<path d="M${vx - 22} ${hy} h18" stroke="#0B1220" stroke-width="5"/><path d="M${vx + 30} ${hy} a18 18 0 0 1 18 -18" stroke="#22D3EE" fill="none"/>`
      return s + `<g fill="#93C5FD" font-size="11" font-family="system-ui"><text x="30" y="40">Kitchen</text><text x="${vx + 10}" y="40">Loft</text><text x="30" y="${hy + 22}">Bed</text></g>`
    },
    photo(r, w, h) { // stylised workshop object on a bench (stands in for an approved photo)
      const bx = w / 2, by = h * 0.62, s = 38 + r() * 20
      return `<rect y="${by + s * 0.6}" width="${w}" height="${h}" fill="#3a2f22"/><rect y="${by + s * 0.6}" width="${w}" height="6" fill="#5a4630"/>
        <path d="M${bx - s} ${by + s * 0.6} V${by - s * 0.2} L${bx} ${by - s * 1.1} L${bx + s} ${by - s * 0.2} V${by + s * 0.6}Z" fill="#c9a26b"/>
        <path d="M${bx - s - 8} ${by - s * 0.15} L${bx} ${by - s * 1.18} L${bx + s + 8} ${by - s * 0.15}" fill="none" stroke="#8b6a3e" stroke-width="7"/>
        <circle cx="${bx}" cy="${by}" r="${s * 0.22}" fill="#2a2016"/><text x="12" y="22" fill="#e2e8f0" font-size="11" font-family="system-ui" opacity=".75">example photo</text>`
    },
  }
  const BG = { beat: '#0f1a30', voxel: '#10233a', cad: '#0c1628', plan: '#0d1f2b', photo: '#2b3b4f' }
  window.cdArt = (kind, seed, h) => wrap(320, h, kinds[kind](rnd(seed), 320, h), BG[kind])
})()
