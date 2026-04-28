import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { ADMIN_TOUR_STEPS } from '../onboarding/adminTourSteps'
import {
  tourCloseJobsJobModal,
  tourOpenJobsEditJobModal,
  tourOpenJobsNewJobModal,
} from '../onboarding/tourJobsHandlers'
import { OnboardingTourOverlay } from '../components/onboarding/OnboardingTourOverlay'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { getOnboardingDoneUserId, setOnboardingDone } from '../lib/onboardingStorage'
import { getTourDebugParam, stripTourDebugFromUrl } from '../lib/tourDebugParam'
import { useAuth } from '../hooks/useAuth'
import { useAppData } from '../hooks/useAppData'
import type { Job } from '../types'
import { OnboardingContext } from './onboardingContext'
import { tourOpenCustomerCreateModal } from '../onboarding/tourCustomersHandlers'

const STEP_SUCCESS: Record<number, string> = {
  0: 'Customer saved',
  1: 'Job created',
  2: 'Details saved',
  3: 'Crew assigned',
  4: 'All set',
}

type Phase = 'idle' | 'welcome' | 'tour' | 'tourFinale'

type StepSnap = {
  customerIds: Set<string>
  jobIds: Set<string>
}

function computeStepRequirementMet(
  stepIndex: number,
  customersLen: number,
  jobsLen: number,
  tourJobId: string | null,
  getJob: (id: string) => Job | undefined,
  dashboardAck: boolean,
): boolean {
  switch (stepIndex) {
    case 0:
      return customersLen >= 1
    case 1:
      return jobsLen >= 1
    case 2: {
      if (!tourJobId) return false
      const j = getJob(tourJobId)
      return !!j && j.title.trim().length > 0 && j.service_type.trim().length > 0
    }
    case 3: {
      if (!tourJobId) return false
      const j = getJob(tourJobId)
      return !!j && j.assignees.length > 0
    }
    case 4:
      return dashboardAck
    default:
      return false
  }
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { customers, jobs, getJob } = useAppData()
  const { user, isReady, developmentBypass, workspaceSubscriptionAccess } = useAuth()
  const [phase, setPhase] = useState<Phase>('idle')
  const [stepIndex, setStepIndex] = useState(0)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [dashboardAck, setDashboardAck] = useState(false)
  /** Set when the tour detects a newly created job; otherwise steps 3–4 fall back to the latest job in the list. */
  const [tourJobIdFromCreation, setTourJobIdFromCreation] = useState<string | null>(null)
  const navAppliedForStep = useRef<number | null>(null)
  const snapRef = useRef<StepSnap>({ customerIds: new Set(), jobIds: new Set() })
  const completionDoneRef = useRef(false)
  const advanceTimerRef = useRef<number | null>(null)
  const tourCustomerIdRef = useRef<string | null>(null)
  const tourJobIdRef = useRef<string | null>(null)
  const customersJobsRef = useRef({ customers, jobs })
  useLayoutEffect(() => {
    customersJobsRef.current = { customers, jobs }
  }, [customers, jobs])

  const isAdminWithWorkspace =
    user?.role === 'admin' &&
    (developmentBypass ||
      workspaceSubscriptionAccess === true ||
      user.auth_mode === 'development')

  const tourDoneForUser = user?.id ? getOnboardingDoneUserId() === user.id : false
  const [tourDebug, setTourDebug] = useState(getTourDebugParam)

  const detailsWereCompleteAtEntryRef = useRef(false)
  const crewWasAssignedAtEntryRef = useRef(false)
  const step2EntryJobIdRef = useRef<string | null>(null)
  const step3EntryJobIdRef = useRef<string | null>(null)
  const [step3AlreadyVariant, setStep3AlreadyVariant] = useState(false)
  const [step4AlreadyVariant, setStep4AlreadyVariant] = useState(false)
  const prevTourStepIndexRef = useRef<number>(-1)

  useEffect(() => {
    const sync = () => setTourDebug(getTourDebugParam())
    sync()
    window.addEventListener('hashchange', sync)
    window.addEventListener('popstate', sync)
    return () => {
      window.removeEventListener('hashchange', sync)
      window.removeEventListener('popstate', sync)
    }
  }, [])

  const resetTourTracking = useCallback(() => {
    tourCustomerIdRef.current = null
    tourJobIdRef.current = null
    setTourJobIdFromCreation(null)
    setDashboardAck(false)
    setSuccessMessage(null)
  }, [])

  const tourJobIdResolved = useMemo(() => {
    if (tourJobIdFromCreation) return tourJobIdFromCreation
    if (phase !== 'tour' || stepIndex < 2) return null
    if (jobs.length === 0) return null
    return jobs[jobs.length - 1].id
  }, [tourJobIdFromCreation, phase, stepIndex, jobs])

  useLayoutEffect(() => {
    tourJobIdRef.current = tourJobIdResolved
  }, [tourJobIdResolved])

  const stepRequirementMet = useMemo(
    () =>
      computeStepRequirementMet(
        stepIndex,
        customers.length,
        jobs.length,
        tourJobIdResolved,
        getJob,
        dashboardAck,
      ),
    [stepIndex, customers.length, jobs.length, tourJobIdResolved, getJob, dashboardAck],
  )

  useLayoutEffect(() => {
    if (phase !== 'tour') {
      prevTourStepIndexRef.current = -1
      step2EntryJobIdRef.current = null
      step3EntryJobIdRef.current = null
      queueMicrotask(() => {
        setStep3AlreadyVariant(false)
        setStep4AlreadyVariant(false)
      })
      return
    }

    const prev = prevTourStepIndexRef.current
    prevTourStepIndexRef.current = stepIndex

    if (prev === 2 && stepIndex !== 2) {
      step2EntryJobIdRef.current = null
      queueMicrotask(() => setStep3AlreadyVariant(false))
    }
    if (prev === 3 && stepIndex !== 3) {
      step3EntryJobIdRef.current = null
      queueMicrotask(() => setStep4AlreadyVariant(false))
    }

    const id = tourJobIdResolved
    if (stepIndex === 2 && id) {
      if (step2EntryJobIdRef.current !== id) {
        const j = getJob(id)
        const was = !!(j && j.title.trim().length > 0 && j.service_type.trim().length > 0)
        detailsWereCompleteAtEntryRef.current = was
        step2EntryJobIdRef.current = id
        queueMicrotask(() => setStep3AlreadyVariant(was))
      }
    }

    if (stepIndex === 3 && id) {
      if (step3EntryJobIdRef.current !== id) {
        const j = getJob(id)
        const was = !!(j && j.assignees.length > 0)
        crewWasAssignedAtEntryRef.current = was
        step3EntryJobIdRef.current = id
        queueMicrotask(() => setStep4AlreadyVariant(was))
      }
    }
  }, [phase, stepIndex, tourJobIdResolved, getJob, jobs])

  const tourStepDisplay = useMemo(() => {
    const base = ADMIN_TOUR_STEPS[stepIndex]
    if (!base) return null
    if (stepIndex === 2 && step3AlreadyVariant && base.titleWhenAlreadyComplete) {
      return {
        ...base,
        title: base.titleWhenAlreadyComplete,
        body: base.bodyWhenAlreadyComplete ?? base.body,
        actionDetail: base.actionDetailWhenAlreadyComplete ?? base.actionDetail,
      }
    }
    if (stepIndex === 3 && step4AlreadyVariant && base.titleWhenAlreadyComplete) {
      return {
        ...base,
        title: base.titleWhenAlreadyComplete,
        body: base.bodyWhenAlreadyComplete ?? base.body,
        actionDetail: base.actionDetailWhenAlreadyComplete ?? base.actionDetail,
      }
    }
    return base
  }, [stepIndex, step3AlreadyVariant, step4AlreadyVariant])

  useEffect(() => {
    if (!isReady || !user || user.role !== 'admin') return
    if (!isAdminWithWorkspace) return
    if (tourDoneForUser && !tourDebug) return
    if (phase !== 'idle') return
    const t = window.setTimeout(() => setPhase('welcome'), 500)
    return () => clearTimeout(t)
  }, [isReady, user, isAdminWithWorkspace, tourDoneForUser, tourDebug, phase])

  useEffect(() => {
    if (phase !== 'tour') {
      navAppliedForStep.current = null
      return
    }
    const step = ADMIN_TOUR_STEPS[stepIndex]
    if (!step) return

    if (navAppliedForStep.current !== stepIndex) {
      navAppliedForStep.current = stepIndex
      navigate(step.path)
    }

    const delay = step.closeJobsModal ? 80 : 0
    const timer = window.setTimeout(() => {
      if (step.closeJobsModal) tourCloseJobsJobModal()
    }, delay)
    return () => clearTimeout(timer)
  }, [phase, stepIndex, navigate])

  useEffect(() => {
    if (advanceTimerRef.current != null) {
      clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
    completionDoneRef.current = false
    if (phase === 'tour') {
      const { customers: c, jobs: j } = customersJobsRef.current
      snapRef.current = {
        customerIds: new Set(c.map((x) => x.id)),
        jobIds: new Set(j.map((x) => x.id)),
      }
    }
  }, [phase, stepIndex])

  useEffect(() => {
    if (phase !== 'tour') return
    const step = ADMIN_TOUR_STEPS[stepIndex]
    if (!step?.autoOpenTourJob) return
    const jobId = tourJobIdRef.current
    if (!jobId) return

    const delay = 480
    const t = window.setTimeout(() => {
      tourOpenJobsEditJobModal(jobId)
      const sel =
        step.autoOpenTourJob === 'crew'
          ? '[data-onboarding="tour-job-crew"]'
          : '[data-onboarding="tour-job-form-core"]'
      window.setTimeout(() => {
        document.querySelector(sel)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }, 420)
    }, delay)
    return () => clearTimeout(t)
  }, [phase, stepIndex])

  const finishTour = useCallback(() => {
    if (user?.id) setOnboardingDone(user.id)
    stripTourDebugFromUrl()
    setTourDebug(getTourDebugParam())
    tourCloseJobsJobModal()
    if (advanceTimerRef.current != null) {
      clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
    resetTourTracking()
    setPhase('idle')
    setStepIndex(0)
    navAppliedForStep.current = null
    completionDoneRef.current = false
  }, [user, resetTourTracking])

  const skipFromWelcome = useCallback(() => {
    if (user?.id) setOnboardingDone(user.id)
    stripTourDebugFromUrl()
    setTourDebug(getTourDebugParam())
    setPhase('idle')
  }, [user])

  const startTourFromWelcome = useCallback(() => {
    if (advanceTimerRef.current != null) {
      clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
    completionDoneRef.current = false
    stripTourDebugFromUrl()
    setTourDebug(getTourDebugParam())
    resetTourTracking()
    setStepIndex(0)
    navAppliedForStep.current = null
    setPhase('tour')
  }, [resetTourTracking])

  const replayTour = useCallback(() => {
    if (advanceTimerRef.current != null) {
      clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
    completionDoneRef.current = false
    stripTourDebugFromUrl()
    setTourDebug(getTourDebugParam())
    tourCloseJobsJobModal()
    resetTourTracking()
    setStepIndex(0)
    navAppliedForStep.current = null
    setPhase('tour')
  }, [resetTourTracking])

  const goToTourFinale = useCallback(() => {
    if (advanceTimerRef.current != null) {
      clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
    setSuccessMessage(null)
    completionDoneRef.current = false
    setPhase('tourFinale')
  }, [])

  const onTourNext = useCallback(() => {
    if (!stepRequirementMet) return
    if (advanceTimerRef.current != null) {
      clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
    setSuccessMessage(null)
    completionDoneRef.current = false

    if (stepIndex >= ADMIN_TOUR_STEPS.length - 1) {
      goToTourFinale()
      return
    }
    setStepIndex((i) => i + 1)
  }, [stepIndex, stepRequirementMet, goToTourFinale])

  const onTourBack = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1))
    navAppliedForStep.current = null
  }, [])

  const onTourSkip = useCallback(() => {
    finishTour()
  }, [finishTour])

  useEffect(() => {
    if (phase !== 'tour') return
    const step = ADMIN_TOUR_STEPS[stepIndex]
    if (!step || completionDoneRef.current) return

    const snap = snapRef.current
    let satisfied = false

    switch (step.completion) {
      case 'customersIncreased':
        satisfied = customers.some((c) => !snap.customerIds.has(c.id))
        if (satisfied) {
          const nc = customers.find((c) => !snap.customerIds.has(c.id))
          if (nc) tourCustomerIdRef.current = nc.id
        }
        break
      case 'jobsIncreased':
        satisfied = jobs.some((j) => !snap.jobIds.has(j.id))
        if (satisfied) {
          const nj = jobs.find((j) => !snap.jobIds.has(j.id))
          if (nj) {
            tourJobIdRef.current = nj.id
            setTourJobIdFromCreation(nj.id)
          }
        }
        break
      case 'tourJobDetailsComplete': {
        const id = tourJobIdRef.current
        const j = id ? getJob(id) : undefined
        const nowComplete =
          !!j && j.title.trim().length > 0 && j.service_type.trim().length > 0
        if (detailsWereCompleteAtEntryRef.current) {
          satisfied = false
        } else {
          satisfied = nowComplete
        }
        break
      }
      case 'tourJobHasAssignees': {
        const id = tourJobIdRef.current
        const j = id ? getJob(id) : undefined
        const nowHas = !!j && j.assignees.length > 0
        if (crewWasAssignedAtEntryRef.current) {
          satisfied = false
        } else {
          satisfied = nowHas
        }
        break
      }
      case 'dashboardTodayAck':
        satisfied = dashboardAck
        break
      default:
        break
    }

    if (!satisfied) return

    completionDoneRef.current = true
    const msg = STEP_SUCCESS[stepIndex] ?? 'Done'
    const si = stepIndex
    setSuccessMessage(msg)
    advanceTimerRef.current = window.setTimeout(() => {
      advanceTimerRef.current = null
      setSuccessMessage(null)
      completionDoneRef.current = false
      if (si >= ADMIN_TOUR_STEPS.length - 1) {
        setPhase('tourFinale')
      } else {
        setStepIndex(si + 1)
      }
    }, 800)
  }, [phase, stepIndex, customers, jobs, getJob, dashboardAck])

  const runPrimaryAction = useCallback(() => {
    const step = ADMIN_TOUR_STEPS[stepIndex]
    if (!step) return

    switch (step.primaryAction) {
      case 'openCustomerCreate':
        navigate('/customers')
        window.setTimeout(() => tourOpenCustomerCreateModal(), 220)
        break
      case 'openNewJobWithTourCustomer':
        navigate('/jobs')
        window.setTimeout(
          () => tourOpenJobsNewJobModal({ customerId: tourCustomerIdRef.current }),
          260,
        )
        break
      case 'openTourJobForDetails': {
        navigate('/jobs')
        const id = tourJobIdRef.current
        window.setTimeout(() => {
          tourOpenJobsEditJobModal(id)
          window.setTimeout(() => {
            document
              .querySelector('[data-onboarding="tour-job-form-core"]')
              ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
          }, 360)
        }, 200)
        break
      }
      case 'openTourJobForCrew': {
        navigate('/jobs')
        const id = tourJobIdRef.current
        window.setTimeout(() => {
          tourOpenJobsEditJobModal(id)
          window.setTimeout(() => {
            document
              .querySelector('[data-onboarding="tour-job-crew"]')
              ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
          }, 360)
        }, 200)
        break
      }
      case 'goToTodayOverview':
        navigate('/dashboard')
        setDashboardAck(true)
        window.setTimeout(() => {
          document
            .querySelector('[data-onboarding="tour-crew-today"]')
            ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        }, 280)
        break
      default:
        break
    }
  }, [stepIndex, navigate])

  const ctx = useMemo(() => ({ replayTour }), [replayTour])

  const tourStep = phase === 'tour' ? tourStepDisplay : null

  return (
    <OnboardingContext.Provider value={ctx}>
      {children}
      <Modal
        open={phase === 'welcome'}
        title="Let's get you running in 60 seconds"
        description="Follow quick actions to add a customer, create a job, assign crew, and see how your team works in the field."
        onClose={skipFromWelcome}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={skipFromWelcome}>
              Not now
            </Button>
            <Button type="button" onClick={startTourFromWelcome}>
              Start tour
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-600 dark:text-[#94A3B8]">
          You can skip anytime or replay the tour later from Settings. Nothing changes in your account until you use the app
          yourself.
        </p>
      </Modal>
      <Modal
        open={phase === 'tourFinale'}
        title="You're ready. Your team can now run jobs."
        description="Your crew uses their phone to see assigned jobs, follow checklists, upload proof photos, and complete work. You manage everything here."
        onClose={finishTour}
        footer={
          <Button type="button" onClick={finishTour}>
            Get started
          </Button>
        }
      >
        <p className="text-sm leading-relaxed text-slate-600 dark:text-[#94A3B8]">
          Open Jobs or the calendar anytime to dispatch work. Crew invites and Today View are available from Team and each
          employee account.
        </p>
      </Modal>
      <OnboardingTourOverlay
        active={phase === 'tour'}
        step={tourStep}
        stepIndex={stepIndex}
        totalSteps={ADMIN_TOUR_STEPS.length}
        successMessage={successMessage}
        stepRequirementMet={stepRequirementMet}
        onPrimaryAction={runPrimaryAction}
        onNext={onTourNext}
        onBack={onTourBack}
        onSkip={onTourSkip}
      />
    </OnboardingContext.Provider>
  )
}
