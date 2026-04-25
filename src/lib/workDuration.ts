import { differenceInMinutes, parseISO } from 'date-fns'

/** Elapsed time from clock-in until now (for in-progress jobs). */
export function formatLiveElapsedSince(startIso: string | null): string | null {
  if (!startIso) return null
  try {
    const start = parseISO(startIso)
    const m = differenceInMinutes(new Date(), start)
    if (m < 0) return '0 min'
    if (m < 60) return `${m} min`
    const h = Math.floor(m / 60)
    const mm = m % 60
    return mm === 0 ? `${h} h` : `${h} h ${mm} min`
  } catch {
    return null
  }
}

/** Human-readable duration between work clock-in and clock-out. */
export function formatWorkDuration(
  startIso: string | null | undefined,
  endIso: string | null | undefined,
): string | null {
  if (!startIso || !endIso) return null
  try {
    const m = differenceInMinutes(parseISO(endIso), parseISO(startIso))
    if (m < 0) return null
    if (m < 60) return `${m} min`
    const h = Math.floor(m / 60)
    const mm = m % 60
    return mm === 0 ? `${h} h` : `${h} h ${mm} min`
  } catch {
    return null
  }
}
