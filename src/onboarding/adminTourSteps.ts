export type TourStepCompletion =
  | 'customersIncreased'
  | 'jobsIncreased'
  | 'tourJobDetailsComplete'
  | 'tourJobHasAssignees'
  | 'dashboardTodayAck'

/** What to run when the user taps the primary action (and optional auto-run on step entry). */
export type TourPrimaryAction =
  | 'openCustomerCreate'
  | 'openNewJobWithTourCustomer'
  | 'openTourJobForDetails'
  | 'openTourJobForCrew'
  | 'goToTodayOverview'

export type AdminTourStep = {
  path: string
  targetSelector: string
  title: string
  body: string
  /** When the step requirement was already met at step entry (e.g. existing job data). */
  titleWhenAlreadyComplete?: string
  bodyWhenAlreadyComplete?: string
  actionDetailWhenAlreadyComplete?: string
  /** Primary CTA — performs navigation/modals via OnboardingProvider. */
  actionLabel: string
  /** Extra line under the default “Do this now to continue” hint. */
  actionDetail?: string
  primaryAction: TourPrimaryAction
  completion: TourStepCompletion
  /** Close job modal before navigating to this step. */
  closeJobsModal?: boolean
  /**
   * When true, opening this step will open the tour job in the edit modal after a short delay.
   * (Primary action still available if the user closed the modal.)
   */
  autoOpenTourJob?: 'details' | 'crew'
}

export const ADMIN_TOUR_STEPS: AdminTourStep[] = [
  {
    path: '/customers',
    targetSelector: '[data-onboarding="tour-add-customer"]',
    title: 'Step 1 — Add a customer',
    body: 'Save each client once. Their address carries into jobs and the schedule automatically.',
    actionLabel: 'Add customer',
    actionDetail: 'Save a new customer to unlock the next step.',
    primaryAction: 'openCustomerCreate',
    completion: 'customersIncreased',
    closeJobsModal: true,
  },
  {
    path: '/jobs',
    targetSelector: '[data-onboarding="tour-create-job"]',
    title: 'Step 2 — Create a job',
    body: 'Start a job for the customer you added. You can refine checklist, photos, and timing in the next step.',
    actionLabel: 'Create job',
    actionDetail: 'Create and save the job to continue.',
    primaryAction: 'openNewJobWithTourCustomer',
    completion: 'jobsIncreased',
    closeJobsModal: true,
  },
  {
    path: '/jobs',
    targetSelector: '[data-onboarding="tour-job-form-core"]',
    title: 'Step 3 — Fill job details',
    body: 'Add a clear title and service type so your crew knows what this visit is about.',
    titleWhenAlreadyComplete: 'Step 3 — Fill job details',
    bodyWhenAlreadyComplete:
      'Job details are already started. You can review or edit them here.',
    actionDetailWhenAlreadyComplete: 'Use the button below to open this job, then tap Next when you are ready.',
    actionLabel: 'Continue with this job',
    actionDetail: 'Save the job with a title and service type filled in.',
    primaryAction: 'openTourJobForDetails',
    completion: 'tourJobDetailsComplete',
    autoOpenTourJob: 'details',
  },
  {
    path: '/jobs',
    targetSelector: '[data-onboarding="tour-job-crew"]',
    title: 'Step 4 — Assign crew',
    body: 'Choose who is on this job. Assigned crew see it on their phone in Today View.',
    titleWhenAlreadyComplete: 'Step 4 — Assign crew',
    bodyWhenAlreadyComplete:
      'Crew is already assigned. You can update assignments here anytime.',
    actionDetailWhenAlreadyComplete: 'Use the button below to open this job, then tap Next when you are ready.',
    actionLabel: 'Assign crew on this job',
    actionDetail: 'Pick at least one crew member and save.',
    primaryAction: 'openTourJobForCrew',
    completion: 'tourJobHasAssignees',
    autoOpenTourJob: 'crew',
  },
  {
    path: '/dashboard',
    targetSelector: '[data-onboarding="tour-crew-today"]',
    title: 'Step 5 — Crew Today View',
    body: 'Here is how field work fits together: you coordinate in StackLess; your crew runs visits on their device.',
    actionLabel: 'View overview on dashboard',
    actionDetail: 'Open the overview below to finish the tour.',
    primaryAction: 'goToTodayOverview',
    completion: 'dashboardTodayAck',
    closeJobsModal: true,
  },
]
