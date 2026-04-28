import { useEffect, useLayoutEffect, useMemo, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '../ui/Button'
import type { AdminTourStep } from '../../onboarding/adminTourSteps'

const PAD = 10
const RING_OUTSET = 4

const overlayCurtainClass =
  'pointer-events-auto fixed bg-slate-950/35 dark:bg-black/40'

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function useMinWidthSm() {
  const [wide, setWide] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 640px)').matches : false,
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)')
    const on = () => setWide(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return wide
}

export function OnboardingTourOverlay({
  active,
  step,
  stepIndex,
  totalSteps,
  successMessage,
  stepRequirementMet,
  onPrimaryAction,
  onNext,
  onBack,
  onSkip,
}: {
  active: boolean
  step: AdminTourStep | null
  stepIndex: number
  totalSteps: number
  successMessage: string | null
  /** When false, Next / Done is disabled (Skip still works). */
  stepRequirementMet: boolean
  onPrimaryAction: () => void
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}) {
  const wide = useMinWidthSm()
  const [rect, setRect] = useState<DOMRect | null>(null)

  const selector = step?.targetSelector ?? null

  useLayoutEffect(() => {
    if (!active || !selector) {
      const id = requestAnimationFrame(() => setRect(null))
      return () => cancelAnimationFrame(id)
    }

    const measure = () => {
      const el = document.querySelector(selector)
      if (!el) {
        setRect(null)
        return
      }
      setRect(el.getBoundingClientRect())
    }

    measure()
    const t = window.setTimeout(measure, 100)
    const t2 = window.setTimeout(measure, 400)

    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      clearTimeout(t)
      clearTimeout(t2)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [active, selector, stepIndex])

  useEffect(() => {
    if (!active || !selector) return
    const el = document.querySelector(selector)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [active, selector, stepIndex])

  const dims = useMemo(() => {
    if (!rect) return null
    const t = rect.top - PAD
    const l = rect.left - PAD
    const r = rect.right + PAD
    const b = rect.bottom + PAD
    const vw = window.innerWidth
    const vh = window.innerHeight
    return { t, l, r, b, vw, vh }
  }, [rect])

  const ringBox = useMemo(() => {
    if (!dims) return null
    return {
      top: dims.t - RING_OUTSET,
      left: dims.l - RING_OUTSET,
      width: dims.r - dims.l + RING_OUTSET * 2,
      height: dims.b - dims.t + RING_OUTSET * 2,
    }
  }, [dims])

  const desktopPanelStyle = useMemo((): CSSProperties | undefined => {
    if (!wide) return undefined
    if (!dims) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: 360,
        width: 'min(360px, calc(100vw - 2rem))',
      }
    }
    const maxW = Math.min(360, typeof window !== 'undefined' ? window.innerWidth - 32 : 360)
    let top = dims.b + PAD + 12 + RING_OUTSET
    const estimatedH = 300
    if (typeof window !== 'undefined' && top + estimatedH > window.innerHeight - 24) {
      top = dims.t - estimatedH - 12 - RING_OUTSET
    }
    if (typeof window !== 'undefined') {
      top = clamp(top, 16, window.innerHeight - estimatedH)
    }
    let left = dims.l + (dims.r - dims.l) / 2 - maxW / 2
    if (typeof window !== 'undefined') {
      left = clamp(left, 16, window.innerWidth - maxW - 16)
    }
    return {
      top,
      left,
      maxWidth: maxW,
      width: maxW,
    }
  }, [wide, dims])

  const isLast = stepIndex >= totalSteps - 1
  const nextLabel = isLast ? 'Done' : 'Next'

  if (!active || !step) return null

  const node = (
    <div className="fixed inset-0 z-[3000]" aria-live="polite">
      {dims ? (
        <>
          <div
            className={overlayCurtainClass}
            style={{ top: 0, left: 0, right: 0, height: Math.max(0, dims.t) }}
            aria-hidden
          />
          <div
            className={overlayCurtainClass}
            style={{
              top: dims.b,
              left: 0,
              right: 0,
              height: Math.max(0, dims.vh - dims.b),
            }}
            aria-hidden
          />
          <div
            className={overlayCurtainClass}
            style={{
              top: dims.t,
              left: 0,
              width: Math.max(0, dims.l),
              height: Math.max(0, dims.b - dims.t),
            }}
            aria-hidden
          />
          <div
            className={overlayCurtainClass}
            style={{
              top: dims.t,
              left: dims.r,
              right: 0,
              height: Math.max(0, dims.b - dims.t),
            }}
            aria-hidden
          />
          {ringBox ? (
            <div
              className="pointer-events-none fixed z-[3002] rounded-xl ring-2 ring-blue-500 ring-offset-2 ring-offset-white/90 dark:ring-blue-400 dark:ring-offset-[#0f1419]/95"
              style={{
                top: ringBox.top,
                left: ringBox.left,
                width: Math.max(0, ringBox.width),
                height: Math.max(0, ringBox.height),
                boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.35)',
              }}
              aria-hidden
            />
          ) : null}
        </>
      ) : (
        <div className={`${overlayCurtainClass} fixed inset-0`} aria-hidden />
      )}

      <div
        className={`pointer-events-auto fixed z-[3003] flex max-h-[min(88dvh,100%-1rem)] flex-col border border-slate-200/90 bg-white shadow-2xl dark:border-[#1F2A36] dark:bg-[#11161D] max-sm:inset-x-0 max-sm:bottom-0 max-sm:rounded-t-[22px] max-sm:border-b-0 max-sm:px-4 max-sm:pt-4 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] sm:rounded-2xl sm:p-4 sm:shadow-xl`}
        style={wide ? desktopPanelStyle : undefined}
        role="dialog"
        aria-label="Tour step"
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">
          Step {stepIndex + 1} of {totalSteps}
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950 dark:text-[#F8FAFC]">{step.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-[#94A3B8]">{step.body}</p>
        <p className="mt-3 text-xs font-medium text-slate-500 dark:text-[#64748B]">
          Do this now to continue
          {step.actionDetail ? (
            <>
              {' '}
              — <span className="text-slate-600 dark:text-[#94A3B8]">{step.actionDetail}</span>
            </>
          ) : null}
        </p>
        {!stepRequirementMet ? (
          <p className="mt-2 text-xs text-amber-800 dark:text-amber-200/90">
            Finish the requirement for this step to unlock Next — or tap the main action above.
          </p>
        ) : null}
        {successMessage ? (
          <p
            className="mt-3 rounded-xl border border-emerald-200/90 bg-emerald-50/95 px-3 py-2 text-sm font-medium text-emerald-900 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-100"
            role="status"
          >
            {successMessage}
          </p>
        ) : null}
        <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain sm:max-h-none">
          <Button type="button" className="!min-h-11 w-full touch-manipulation text-sm" onClick={onPrimaryAction}>
            {step.actionLabel}
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
            <Button
              type="button"
              variant="secondary"
              className="!min-h-11 w-full touch-manipulation text-sm sm:min-w-[7.5rem]"
              onClick={onSkip}
            >
              Skip tour
            </Button>
            <div className="flex w-full gap-2 sm:ml-auto sm:w-auto">
              {stepIndex > 0 ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="!min-h-11 min-w-0 flex-1 touch-manipulation text-sm sm:flex-none"
                  onClick={onBack}
                >
                  Back
                </Button>
              ) : null}
              <Button
                type="button"
                variant="secondary"
                className="!min-h-11 min-w-0 flex-1 touch-manipulation text-sm sm:min-w-[5.5rem] sm:flex-none"
                disabled={!stepRequirementMet}
                title={!stepRequirementMet ? 'Finish this step to continue' : undefined}
                onClick={onNext}
              >
                {nextLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(node, document.body)
}
