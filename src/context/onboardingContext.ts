import { createContext, useContext } from 'react'

export type OnboardingContextValue = {
  /** Start the guided tour from step 1 (e.g. Settings replay). */
  replayTour: () => void
}

export const OnboardingContext = createContext<OnboardingContextValue | null>(null)

export function useOnboarding() {
  return useContext(OnboardingContext)
}
