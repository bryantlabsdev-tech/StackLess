/** TestFlight public join URL (override via `VITE_TESTFLIGHT_URL`). */
export const TESTFLIGHT_URL =
  (import.meta.env.VITE_TESTFLIGHT_URL as string | undefined)?.trim() ||
  'https://testflight.apple.com/join/zbvZPNHE'
