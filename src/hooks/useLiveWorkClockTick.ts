import { useEffect, useState } from 'react'

/** Re-render periodically while field work is in progress so elapsed times stay fresh. */
export function useLiveWorkClockTick(active: boolean, intervalMs = 10_000) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => setTick((n) => n + 1), intervalMs)
    return () => window.clearInterval(id)
  }, [active, intervalMs])
  return tick
}
