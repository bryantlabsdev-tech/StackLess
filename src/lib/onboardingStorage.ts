const STORAGE_KEY = 'stackless.onboarding.v1.done'

export function getOnboardingDoneUserId(): string | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v && v.length > 0 ? v : null
  } catch {
    return null
  }
}

export function setOnboardingDone(userId: string) {
  try {
    localStorage.setItem(STORAGE_KEY, userId)
  } catch {
    /* ignore */
  }
}

export function clearOnboardingDone() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
