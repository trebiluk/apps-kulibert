// Bertopia wiring for the shared slot contract. The arrays stay the ones the save already uses.
export function bindBertopiaSlots(api) {
  const KS = typeof window !== 'undefined' ? window.KulibertSlots : null
  if (!KS) return null
  KS.config({
    icon: (item) => api.icon(item),
    name: (item) => api.name(item),
    t: (k) => api.t(k),
    cap: (item) => api.cap(item),
    reducedMotion: () => {
      try {
        if (document.documentElement.getAttribute('data-kp-motion') === 'less') return true
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      } catch (e) { return false }
    },
    onChange: () => { if (api.onChange) api.onChange() },
    toast: (msg) => { if (api.toast) api.toast(msg) },
  })
  return KS
}
