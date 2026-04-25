import { useEffect, type ReactNode } from 'react'
import { Button } from './Button'

export function Modal({
  open,
  title,
  description,
  children,
  onClose,
  footer,
  wide,
}: {
  open: boolean
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
  footer?: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <button
        type="button"
        className="modal-backdrop-enter absolute inset-0 bg-slate-950/45 backdrop-blur-sm transition hover:bg-slate-950/55 dark:bg-black/70 dark:hover:bg-black/75"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        className={`modal-panel-enter relative z-10 flex max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1rem)] w-full flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-2xl shadow-slate-900/15 ring-1 ring-black/[0.04] dark:border-[#1F2A36] dark:bg-[#11161D] dark:shadow-black/50 dark:ring-white/[0.05] sm:max-h-[90vh] ${
          wide ? 'max-w-3xl' : 'max-w-lg'
        }`}
      >
        <div className="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 bg-white px-4 py-3 dark:border-[#1F2A36] dark:bg-[#11161D] sm:px-5 sm:py-4">
          <div className="min-w-0 pr-2">
            <h2 id="modal-title" className="text-lg font-semibold tracking-[-0.03em] text-slate-950 dark:text-[#F8FAFC]">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-[#94A3B8]">{description}</p>
            ) : null}
          </div>
          <Button variant="ghost" className="-mr-2 min-h-11 min-w-11 !p-2" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">{children}</div>
        {footer ? (
          <div className="sticky bottom-0 z-10 flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-[#1F2A36] dark:bg-[#11161D] sm:flex-row sm:justify-end sm:px-5 sm:py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}
