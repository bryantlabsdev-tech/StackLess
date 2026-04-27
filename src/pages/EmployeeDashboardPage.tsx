import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppData } from '../hooks/useAppData'
import { useAuth } from '../hooks/useAuth'
import { PageContainer } from '../components/layout/PageContainer'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { JobStatusBadge } from '../components/ui/Badge'
import { DirectPhotoCaptureButtons } from '../components/execution/DirectPhotoCaptureButtons'
import { canMarkJobComplete } from '../lib/jobCompletion'
import { formatJobValue, optionalJobValue } from '../lib/jobValue'
import { formatDisplayDate, formatISODate } from '../lib/format'
import type { Job, JobTask } from '../types'

const secondaryBtn =
  'inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700'

const terminalStatuses = new Set(['completed', 'needs_verification', 'verified', 'canceled'])

function taskSummary(tasks: JobTask[]) {
  if (tasks.length === 0) return 'No tasks assigned'
  const done = tasks.filter((task) => task.is_completed).length
  return `${done} of ${tasks.length} tasks done`
}

export function EmployeeDashboardPage() {
  const { user } = useAuth()
  const {
    jobs,
    jobTasks,
    taskPhotos,
    startWork,
    completeWork,
  } = useAppData()
  const employeeId = user?.role === 'employee' ? user.employee_id : null
  const [completeErrors, setCompleteErrors] = useState<Record<string, string>>({})

  const mine = useMemo(
    () =>
      employeeId
        ? jobs
            .filter((j) => j.assignees.includes(employeeId))
            .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
        : [],
    [jobs, employeeId],
  )

  const today = formatISODate(new Date())
  const grouped = useMemo(() => {
    const todayJobs = mine.filter((j) => j.date === today)
    const otherJobs = mine.filter((j) => j.date !== today)
    return { todayJobs, otherJobs }
  }, [mine, today])

  const tasksByJob = useMemo(() => {
    const map = new Map<string, JobTask[]>()
    for (const task of jobTasks) {
      const list = map.get(task.job_id) ?? []
      list.push(task)
      map.set(task.job_id, list)
    }
    return map
  }, [jobTasks])

  const handleComplete = (job: Job) => {
    void (async () => {
      setCompleteErrors((prev) => {
        const next = { ...prev }
        delete next[job.id]
        return next
      })
      const result = await completeWork(job.id)
      if (!result.ok) {
        setCompleteErrors((prev) => ({
          ...prev,
          [job.id]: result.reason ?? 'Cannot complete this job yet.',
        }))
      }
    })()
  }

  const renderJobCard = (job: Job, isToday: boolean) => {
    const tasks = tasksByJob.get(job.id) ?? []
    const taskIds = new Set(tasks.map((task) => task.id))
    const photos = taskPhotos.filter((photo) => taskIds.has(photo.task_id))
    const completion = canMarkJobComplete(job.checklist, tasks, photos, {
      requiresPhotos: job.requires_photos,
    })
    const isTerminal = terminalStatuses.has(job.status)
    const photoTask = tasks.find((row) => !row.is_completed) ?? tasks[0] ?? null
    const canStart = !job.work_started_at && !isTerminal
    const canComplete = Boolean(job.work_started_at) && !isTerminal
    const value = optionalJobValue(job)

    return (
      <article
        key={job.id}
        className={`overflow-hidden rounded-[24px] border bg-white shadow-sm dark:bg-slate-900 ${
          isToday
            ? 'border-emerald-300 ring-2 ring-emerald-500/15 dark:border-emerald-800 dark:ring-emerald-500/20'
            : 'border-slate-200/90 dark:border-slate-800'
        }`}
      >
        <div className={`h-1.5 ${isToday ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                {isToday ? 'Today' : formatDisplayDate(job.date)}
              </p>
              <h2 className="mt-1.5 break-words text-xl font-bold leading-tight text-slate-950 dark:text-white">
                {job.title}
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">
                {job.customer_name}
              </p>
            </div>
            <JobStatusBadge status={job.status} />
          </div>

          <div className="grid gap-3 rounded-2xl bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Time
              </p>
              <p className="mt-1 font-semibold tabular-nums text-slate-900 dark:text-white">
                {job.start_time} - {job.end_time}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Address
              </p>
              <p className="mt-1 leading-relaxed text-slate-700 dark:text-slate-200">{job.address}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Tasks
              </p>
              <p className="mt-1 font-semibold text-slate-900 dark:text-white">{taskSummary(tasks)}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Job value
              </p>
              <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                {value == null ? 'Not set' : formatJobValue(value)}
              </p>
            </div>
          </div>

          {job.notes.trim() ? (
            <p className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-3 text-sm leading-relaxed text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/35 dark:text-amber-100">
              {job.notes}
            </p>
          ) : null}

          {completeErrors[job.id] ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-sm font-medium text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100">
              {completeErrors[job.id]}
            </p>
          ) : null}

          <DirectPhotoCaptureButtons
            jobId={job.id}
            taskId={photoTask?.id ?? null}
            disabled={isTerminal}
            notePrefix={`${job.title} - ${photoTask?.title ?? 'Job photo'}`}
          />

          <div className="grid gap-2 min-[430px]:grid-cols-2">
            <Button
              type="button"
              className="min-h-[52px] rounded-2xl text-base"
              disabled={!canStart}
              onClick={() => void startWork(job.id)}
            >
              Start job
            </Button>
            <Button
              type="button"
              variant={completion.ok ? 'primary' : 'secondary'}
              className="min-h-[52px] rounded-2xl text-base"
              disabled={!canComplete}
              onClick={() => handleComplete(job)}
            >
              Complete job
            </Button>
          </div>

          <Link
            to={`/my-jobs/${job.id}`}
            className="flex min-h-[48px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Open full job details
          </Link>
        </div>
      </article>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Today"
        description={`Your assigned work for ${formatDisplayDate(today)}. Start jobs, capture proof, and submit completed work from the field.`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link to="/my-schedule" className={secondaryBtn}>
              My schedule
            </Link>
            <Link
              to="/my-jobs"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
            >
              My jobs
            </Link>
          </div>
        }
      />

      {!employeeId ? (
        <EmptyState
          title="No crew profile linked"
          detail="Ask an admin to link your login to an employee record before using Today View."
        />
      ) : grouped.todayJobs.length === 0 && grouped.otherJobs.length === 0 ? (
        <EmptyState
          title="No assigned jobs"
          detail="Jobs assigned to you will appear here with quick field actions."
        />
      ) : (
        <div className="space-y-6">
          <section className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
                  Today&apos;s jobs
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                  {grouped.todayJobs.length} assigned today
                </h2>
              </div>
            </div>
            {grouped.todayJobs.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                Nothing assigned for today.
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {grouped.todayJobs.map((job) => renderJobCard(job, true))}
              </div>
            )}
          </section>

          {grouped.otherJobs.length > 0 ? (
            <section className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Other assigned jobs
              </p>
              <div className="grid gap-4 xl:grid-cols-2">
                {grouped.otherJobs.map((job) => renderJobCard(job, false))}
              </div>
            </section>
          ) : null}
        </div>
      )}

    </PageContainer>
  )
}
