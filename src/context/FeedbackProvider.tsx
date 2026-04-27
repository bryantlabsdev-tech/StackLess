import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  FeedbackContext,
  type FeedbackContextValue,
  type FeedbackMessage,
} from './feedbackContext'

const toneClass: Record<FeedbackMessage['tone'], string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100',
  error: 'border-red-200 bg-red-50 text-red-950 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-100',
}

function newMessageId() {
  return crypto.randomUUID()
}

function errorDetail(error: unknown) {
  if (error instanceof Error) return error.message
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message
  }
  return 'Please try again.'
}

function errorTitle(error: unknown, fallback: string) {
  if (
    error &&
    typeof error === 'object' &&
    'feedbackTitle' in error &&
    typeof (error as { feedbackTitle?: unknown }).feedbackTitle === 'string'
  ) {
    return (error as { feedbackTitle: string }).feedbackTitle
  }
  return fallback
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<FeedbackMessage[]>([])
  const [syncCount, setSyncCount] = useState(0)

  const dismiss = useCallback((id: string) => {
    setMessages((prev) => prev.filter((message) => message.id !== id))
  }, [])

  const notify = useCallback(
    (message: Omit<FeedbackMessage, 'id'>) => {
      const id = newMessageId()
      setMessages((prev) => [{ ...message, id }, ...prev].slice(0, 4))
      window.setTimeout(() => dismiss(id), message.tone === 'error' ? 9000 : 4200)
    },
    [dismiss],
  )

  const trackSync = useCallback<FeedbackContextValue['trackSync']>(
    async (promise, options) => {
      setSyncCount((count) => count + 1)
      try {
        const result = await promise
        if (options?.success) notify({ tone: 'success', title: options.success })
        return result
      } catch (error) {
        notify({
          tone: 'error',
          title: errorTitle(error, options?.error ?? 'Sync failed'),
          detail: errorDetail(error),
        })
        throw error
      } finally {
        setSyncCount((count) => Math.max(0, count - 1))
      }
    },
    [notify],
  )

  const value = useMemo<FeedbackContextValue>(
    () => ({ messages, syncCount, notify, dismiss, trackSync }),
    [messages, syncCount, notify, dismiss, trackSync],
  )

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] right-3 z-[80] flex w-[min(24rem,calc(100vw-1.5rem))] flex-col gap-2 md:bottom-4"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`pointer-events-auto rounded-2xl border px-4 py-3 text-sm shadow-xl shadow-slate-900/10 backdrop-blur dark:shadow-black/30 ${toneClass[message.tone]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold">{message.title}</p>
                {message.detail ? (
                  <p className="mt-1 leading-relaxed opacity-85">{message.detail}</p>
                ) : null}
              </div>
              <button
                type="button"
                className="-mr-1 rounded-lg px-2 py-1 text-xs font-bold opacity-70 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
                onClick={() => dismiss(message.id)}
                aria-label="Dismiss message"
              >
                Close
              </button>
            </div>
          </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  )
}
