import { useMemo } from 'react'
import { useAppData } from '../../hooks/useAppData'
import { buildNewJob } from '../../lib/jobDefaults'
import { formatDisplayDate } from '../../lib/format'
import { Modal } from '../ui/Modal'
import { JobForm } from './JobForm'
import type { Job } from '../../types'

export function JobModal({
  open,
  onClose,
  jobId,
  initialDate,
  initialAssigneeId,
  newJobTitle,
  newJobDescription,
}: {
  open: boolean
  onClose: () => void
  jobId: string | null
  initialDate?: string
  initialAssigneeId?: string | null
  /** When creating (no jobId), overrides default “New job” copy — e.g. calendar quick add. */
  newJobTitle?: string
  newJobDescription?: string
}) {
  const { customers, employees, addJob, updateJob, getJob } = useAppData()
  const job = jobId ? getJob(jobId) : undefined

  const initial: Omit<Job, 'id'> = useMemo(() => {
    if (job) {
      const { id, ...rest } = job
      void id
      return rest
    }
    const base = buildNewJob(customers, initialDate)
    if (initialAssigneeId) {
      return {
        ...base,
        assignees: [initialAssigneeId],
        status: 'scheduled',
      }
    }
    return base
  }, [job, customers, initialDate, initialAssigneeId])

  const formKey = jobId ?? `new-${initialDate ?? 'x'}-${initialAssigneeId ?? 'na'}`

  const scheduleDateLabel =
    !jobId && initialDate ? formatDisplayDate(initialDate) : undefined

  return (
    <Modal
      open={open}
      title={jobId ? 'Edit job' : (newJobTitle ?? 'New job')}
      description={
        jobId
          ? 'Update timing, crew, details, or status — changes show on the schedule immediately.'
          : (newJobDescription ??
            'Pick a customer (or add a new one), set the time window, assign crew, and save. You can fine-tune details anytime.')
      }
      onClose={onClose}
      wide
    >
      {!jobId && scheduleDateLabel ? (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-3.5 py-2.5 text-sm dark:border-emerald-800/60 dark:bg-emerald-950/40">
          <span className="font-medium text-emerald-900 dark:text-emerald-200">Scheduled for</span>
          <span className="font-semibold tabular-nums text-emerald-950 dark:text-white">
            {scheduleDateLabel}
          </span>
        </div>
      ) : null}
      <JobForm
        key={formKey}
        customers={customers}
        employees={employees}
        initial={initial}
        scheduleDateLabel={scheduleDateLabel}
        submitLabel={jobId ? 'Save changes' : 'Create job'}
        onCancel={onClose}
        onSubmit={(values) => {
          if (jobId) updateJob(jobId, values)
          else addJob(values)
          onClose()
        }}
      />
    </Modal>
  )
}
