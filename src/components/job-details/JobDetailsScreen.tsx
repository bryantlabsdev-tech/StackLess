import { useMemo, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useAppData } from '../../hooks/useAppData'
import { canMarkJobComplete } from '../../lib/jobCompletion'
import type { Job } from '../../types'
import { ActionBar } from './ActionBar'
import { ChecklistSection } from './ChecklistSection'
import { JobHeader } from './JobHeader'
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
    updateChecklistItem,
    addChecklistItem,
    updateChecklistItemTitle,
    deleteChecklistItem,
    startWork,
    undoStartWork,
    completeWork,
  } = useAppData()
  const { user } = useAuth()
  const [completeError, setCompleteError] = useState<string | null>(null)

  const tasks = useMemo(
    () => jobTasks.filter((t) => t.job_id === job.id),
    [jobTasks, job.id],
  )

  const completionPreview = useMemo(
    () => canMarkJobComplete(job.checklist, tasks),
    [job.checklist, tasks],
  )

  const canControl =
    variant === 'admin' ||
    (user?.role === 'employee' &&
      user.employee_id != null &&
      job.assignees.includes(user.employee_id))

  const checklistDisabled =
    job.status === 'completed' || job.status === 'canceled' || !canControl

  const canManageChecklistStructure =
    user?.role === 'admin' &&
    job.status !== 'completed' &&
    job.status !== 'canceled'

  const taskInteractionLocked =
    job.status === 'completed' || job.status === 'canceled' || !canControl

  const hint =
    !job.work_completed_at && !completionPreview.ok ? completionPreview.reason ?? null : null

  const handleComplete = () => {
    setCompleteError(null)
    const r = completeWork(job.id)
    if (!r.ok) setCompleteError(r.reason ?? 'Cannot complete yet.')
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

      <ActionBar
        job={job}
        canControl={canControl}
        onStart={() => {
          setCompleteError(null)
          startWork(job.id)
        }}
        onComplete={handleComplete}
        onUndoStart={() => {
          setCompleteError(null)
          undoStartWork(job.id)
        }}
        blockCompleteReason={completeError ?? hint}
      />

      <section>
        <h2 className="px-0.5 text-xl font-bold tracking-tight text-gray-900 dark:text-white">Tasks</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-gray-400">
          Work through these in order. Expand a task for photos and full instructions.
        </p>
        <div className="mt-5">
          <TaskList job={job} showAddTask={showAddTask} canEdit={!taskInteractionLocked} />
        </div>
      </section>

      <TimeTracker job={job} />

      <ChecklistSection
        items={job.checklist}
        toggleDisabled={checklistDisabled}
        canManageStructure={canManageChecklistStructure}
        onToggle={(itemId, is_completed) => {
          setCompleteError(null)
          updateChecklistItem(job.id, itemId, is_completed)
        }}
        onAddItem={(title) => {
          setCompleteError(null)
          addChecklistItem(job.id, title)
        }}
        onUpdateTitle={(itemId, title) => {
          setCompleteError(null)
          updateChecklistItemTitle(job.id, itemId, title)
        }}
        onDeleteItem={(itemId) => {
          setCompleteError(null)
          deleteChecklistItem(job.id, itemId)
        }}
      />
    </div>
  )
}
