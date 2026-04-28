import { parsePhoneNumberFromString } from 'libphonenumber-js'

/** Normalize US-focused input to E.164 (e.g. 2162192835 → +12162192835). Returns null if invalid or empty. */
export function normalizePhoneToE164(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const parsed = parsePhoneNumberFromString(trimmed, 'US')
  return parsed?.isValid() ? parsed.number : null
}

export function isValidInviteEmail(raw: string): boolean {
  const s = raw.trim().toLowerCase()
  if (!s || !s.includes('@')) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}
