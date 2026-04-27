import { createContext } from 'react'

export type FeedbackTone = 'info' | 'success' | 'error'

export interface FeedbackMessage {
  id: string
  tone: FeedbackTone
  title: string
  detail?: string
}

export interface FeedbackContextValue {
  messages: FeedbackMessage[]
  syncCount: number
  notify: (message: Omit<FeedbackMessage, 'id'>) => void
  dismiss: (id: string) => void
  trackSync: <T>(promise: Promise<T>, options?: { success?: string; error?: string }) => Promise<T>
}

export const FeedbackContext = createContext<FeedbackContextValue | null>(null)
