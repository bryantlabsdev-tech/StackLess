export type TourOpenNewJobOpts = {
  customerId?: string | null
}

type Handlers = {
  openNewJob: (opts?: TourOpenNewJobOpts) => void
  openEditJob: (jobId: string) => void
  closeModal: () => void
}

let handlers: Handlers | null = null

export function registerTourJobsHandlers(h: Handlers) {
  handlers = h
}

export function unregisterTourJobsHandlers() {
  handlers = null
}

export function tourOpenJobsNewJobModal(opts?: TourOpenNewJobOpts) {
  handlers?.openNewJob(opts)
}

export function tourOpenJobsEditJobModal(jobId: string | null) {
  if (jobId) handlers?.openEditJob(jobId)
}

export function tourCloseJobsJobModal() {
  handlers?.closeModal()
}
