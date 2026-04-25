/** Browser session for mock auth — replace with Supabase session listener later. */
export const AUTH_STORAGE_KEY = 'groundwork_auth_v1'

export interface StoredSession {
  profileId: string
  email: string
  role: 'admin' | 'employee'
  /** For employees only */
  employee_id: string | null
}

export function readStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredSession
  } catch {
    return null
  }
}

export function writeStoredSession(s: StoredSession | null) {
  try {
    if (!s) localStorage.removeItem(AUTH_STORAGE_KEY)
    else localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(s))
  } catch {
    /* ignore */
  }
}
