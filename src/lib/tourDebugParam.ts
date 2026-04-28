/** `?tour=true` on the document URL or after the hash forces the full admin onboarding flow (testing). */

export function getTourDebugParam(): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (new URLSearchParams(window.location.search).get('tour') === 'true') return true
    const hash = window.location.hash
    const q = hash.indexOf('?')
    if (q >= 0) {
      return new URLSearchParams(hash.slice(q + 1)).get('tour') === 'true'
    }
  } catch {
    /* ignore */
  }
  return false
}

export function stripTourDebugFromUrl() {
  if (typeof window === 'undefined') return
  try {
    const u = new URL(window.location.href)
    let changed = false
    if (u.searchParams.get('tour') === 'true') {
      u.searchParams.delete('tour')
      changed = true
    }
    const hash = u.hash
    const qi = hash.indexOf('?')
    if (qi >= 0) {
      const base = hash.slice(0, qi)
      const sp = new URLSearchParams(hash.slice(qi + 1))
      if (sp.get('tour') === 'true') {
        sp.delete('tour')
        const tail = sp.toString()
        u.hash = tail ? `${base}?${tail}` : base
        changed = true
      }
    }
    if (changed) {
      window.history.replaceState({}, '', `${u.pathname}${u.search}${u.hash}`)
    }
  } catch {
    /* ignore */
  }
}
