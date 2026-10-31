// The one place that says whether server sync is on: ?sync=1 in the URL, or the flag
// the sync code keeps in sessionStorage so a reload stays on. server-sync.js and sync-chip.js both read it.
export function flagOn() {
  try {
    if (typeof location !== 'undefined' && /(?:\?|&)sync=1(?:&|$)/.test(location.search)) return true
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('bt-sync') === '1') return true
  } catch (e) {}
  return false
}

export function persistFlag() {
  try {
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('bt-sync', '1')
  } catch (e) {}
}
