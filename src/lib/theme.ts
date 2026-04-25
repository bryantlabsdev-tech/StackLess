/** localStorage key — keep in sync with inline script in index.html */
export const THEME_STORAGE_KEY = 'groundwork-theme'

export type ThemeMode = 'light' | 'dark'

export function readStoredTheme(): ThemeMode {
  try {
    const s = localStorage.getItem(THEME_STORAGE_KEY)
    if (s === 'dark' || s === 'light') return s
  } catch {
    /* ignore */
  }
  return 'dark'
}

export function applyThemeClassToDocument(theme: ThemeMode) {
  const root = document.documentElement
  if (theme === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
}
