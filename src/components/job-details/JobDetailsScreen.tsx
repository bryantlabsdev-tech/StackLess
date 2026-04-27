import { useMemo, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useAppData } from '../../hooks/useAppData'
import { canMarkJobComplete } from '../../lib/jobCompletion'
import type { Job } from '../../types'
import { Button } from '../ui/Button'
import { ActionBar } from './ActionBar'
import { ChecklistSection } from './ChecklistSection'
import { JobHeader } from './JobHeader'
import { JobPhotosSection } from './JobPhotosSection'
import { JobTimelineSection } from './JobTimelineSection'
import { TaskList } from './TaskList'
import { TimeTracker } from './TimeTracker'

export function JobDetailsScreen({
  job,
  variant,
  showAddTask,
  showJobHeader = true,
}: {
  job: Job
  variant: 'field' | 'admin'
  showAddTask: boolean
  /** Set false on admin job page Work tab where the page header already shows the title. */
  showJobHeader?: boolean
}) {
  const {
    jobTasks,
    taskPhotos,
    updateChecklistItem,
    addChecklistItem,
    updateChecklistItemTitle,
    deleteChecklistItem,
    startWork,
    undoStartWork,
    completeWork,
    verifyJob,
  } = useAppData()
  const { user } = useAuth()
  const [completeError, setCompleteError] = useState<string | null>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  const tasks = useMemo(
    () => jobTasks.filter((t) => t.job_id === job.id),
    [jobTasks, job.id],
  )

  const completionPreview = useMemo(
    () => {
      const taskIds = new Set(tasks.map((task) => task.id))
      const photos = taskPhotos.filter((photo) => taskIds.has(photo.task_id))
      return canMarkJobComplete(job.checklist, tasks, photos, {
        requiresPhotos: job.requires_photos,
      })
    },
    [job.checklist, job.requires_photos, taskPhotos, tasks],
  )

  const canControl =
    variant === 'admin' ||
    (user?.role === 'employee' &&
      user.employee_id != null &&
      job.assignees.includes(user.employee_id))

  const checklistDisabled =
    job.status === 'completed' ||
    job.status === 'needs_verification' ||
    job.status === 'verified' ||
    job.status === 'canceled' ||
    !canControl

  const canManageChecklistStructure =
    user?.role === 'admin' &&
    job.status !== 'completed' &&
    job.status !== 'needs_verification' &&
    job.status !== 'verified' &&
    job.status !== 'canceled'

  const taskInteractionLocked =
    job.status === 'completed' ||
    job.status === 'needs_verification' ||
    job.status === 'verified' ||
    job.status === 'canceled' ||
    !canControl

  const canManageJobPhotos = user?.role === 'admin'
  const canInteractWithTasks = !taskInteractionLocked && canControl
  const canVerifyJob = user?.role === 'admin' && job.status === 'needs_verification'

  const hint =
    !job.work_completed_at && !completionPreview.ok ? completionPreview.reason ?? null : null

  const handleComplete = () => {
    void (async () => {
      setCompleteError(null)
      const r = await completeWork(job.id)
      if (!r.ok) setCompleteError(r.reason ?? 'Cannot complete yet.')
    })()
  }

  const handleVerify = () => {
    void (async () => {
      setVerifyError(null)
      const r = await verifyJob(job.id)
      if (!r.ok) setVerifyError(r.reason ?? 'Cannot verify this job yet.')
    })()
  }

  const shell =
    variant === 'field'
      ? 'mx-auto w-full max-w-2xl space-y-5 pb-8 pt-1'
      : 'space-y-6'

  return (
    <div className={shell}>
      {showJobHeader ? <JobHeader job={job} /> : null}

      {!showJobHeader && variant === 'admin' ? (
        <section className="rounded-2xl border border-slate-200/90 bg-white p-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="font-semibold text-gray-900 dark:text-white">{job.customer_name}</p>
          <p className="mt-1 leading-relaxed text-slate-600 dark:text-gray-400">{job.address}</p>
        </section>
      ) : null}

      {variant === 'field' && showJobHeader ? (
        <p className="text-[15px] leading-relaxed text-slate-600 dark:text-gray-400">
          Open each task, follow the instructions, and add photos to document the site. Finish every task, then use the checklist before you tap{' '}
          <span className="font-semibold text-slate-800 dark:text-gray-200">Complete job</span>.
        </p>
      ) : null}

      {job.notes?.trim() ? (
        <section className="rounded-2xl border border-amber-100 bg-amber-50/90 p-4 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/35 sm:p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-amber-900/70 dark:text-amber-200/80">
            Job-level notes
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-amber-950 dark:text-amber-50">
            {job.notes}
          </p>
        </section>
      ) : null}

      {job.verification_feedback.trim() ? (
        <section className="rounded-2xl border border-red-200 bg-red-50/90 p-4 shadow-sm dark:border-red-900/50 dark:bg-red-950/35 sm:p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-red-900/75 dark:text-red-200/85">
            Verification feedback
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-red-950 dark:text-red-50">
            {job.verification_feedback}
          </p>
        </section>
      ) : null}

      <ActionBar
        job={job}
        canControl={canControl}
        onStart={() => {
          setCompleteError(null)
          void startWork(job.id)
        }}
        onComplete={handleComplete}
        onUndoStart={() => {
          setCompleteError(null)
          void undoStartWork(job.id)
        }}
        blockCompleteReason={completeError ?? hint}
      />

      {canVerifyJob ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/35 sm:p-5">
          <h2 className="text-xl font-bold tracking-tight text-amber-950 dark:text-amber-100">
            Admin verification
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-amber-900/85 dark:text-amber-200/85">
            Review the job notes, checklist, task progress, and photos below. Approving this job marks it as verified.
          </p>
          {verifyError ? (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100">
              {verifyError}
            </p>
          ) : null}
          <Button type="button" className="mt-4 min-h-[48px] rounded-2xl font-semibold" onClick={handleVerify}>
            Approve and verify job
          </Button>
        </section>
      ) : null}

      <JobPhotosSection job={job} canManage={canManageJobPhotos} />

      <JobTimelineSection job={job} />

      <section>
        <h2 className="px-0.5 text-xl font-bold tracking-tight text-gray-900 dark:text-white">Tasks</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-gray-400">
          Work through these in order. Expand a task for photos and full instructions.
        </p>
        <div className="mt-5">
          <TaskList
            job={job}
            showAddTask={showAddTask}
            canEdit={canInteractWithTasks}
          />
        </div>
      </section>

      <TimeTracker job={job} />

      <ChecklistSection
        items={job.checklist}
        toggleDisabled={checklistDisabled}
        canManageStructure={canManageChecklistStructure}
        onToggle={(itemId, is_completed) => {
          setCompleteError(null)
          void updateChecklistItem(job.id, itemId, is_completed)
        }}
        onAddItem={(title) => {
          setCompleteError(null)
          void addChecklistItem(job.id, title)
        }}
        onUpdateTitle={(itemId, title) => {
          setCompleteError(null)
          void updateChecklistItemTitle(job.id, itemId, title)
        }}
        onDeleteItem={(itemId) => {
          setCompleteError(null)
          void deleteChecklistItem(job.id, itemId)
        }}
      />
    </div>
  )
}
