// Crew badges for C4: Crew Medic (10 help-ups), Flanker (10 back hits). Alias only, saved in world doc.
let counts = { medic: 0, flanker: 0 }
let earned = new Set()
export function bumpMedic() {
  counts.medic++
  if (counts.medic >= 10 && !earned.has('medic')) {
    earned.add('medic')
    showChip('Crew Medic')
  }
}
export function bumpFlanker() {
  counts.flanker++
  if (counts.flanker >= 10 && !earned.has('flanker')) {
    earned.add('flanker')
    showChip('Flanker')
  }
}
function showChip(name) {
  try {
    const el = document.createElement('div')
    el.textContent = '🏅 ' + name
    el.setAttribute('role', 'status')
    el.style.cssText = 'position:fixed;top:18%;left:50%;transform:translateX(-50%);background:#1e3a8a;color:#fff;padding:8px 14px;border-radius:10px;font:700 16px sans-serif;z-index:42;pointer-events:none'
    document.body.append(el)
    setTimeout(() => el.remove(), 3000)
  } catch (e) {}
}
export function saveBadges(doc) {
  if (!doc) return
  doc.crewBadges = { counts, earned: [...earned] }
}
export function loadBadges(doc) {
  if (!doc || !doc.crewBadges) return
  counts = doc.crewBadges.counts || counts
  earned = new Set(doc.crewBadges.earned || [])
}
