import { useState } from 'react'
import type { Job } from '../../types'
import { useAppData } from '../../hooks/useAppData'
import { CrewFacepile } from '../ui/CrewFacepile'
import { formatAssigneesSummary } from '../../lib/jobAssignees'
import { formatDisplayDate } from '../../lib/format'
import { formatLiveElapsedSince, formatWorkDuration } from '../../lib/workDuration'
import { useLiveWorkClockTick } from '../../hooks/useLiveWorkClockTick'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

function jobActionPhase(job: Job, started: boolean, completed: boolean) {
  if (job.status === 'canceled') return 'canceled' as const
  if (completed || job.status === 'completed') return 'completed' as const
  if (started) return 'in_progress' as const
  return 'not_started' as const
}

export function ActionBar({
  job,
  canControl,
  onStart,
  onComplete,
  onUndoStart,
  blockCompleteReason,
}: {
  job: Job
  canControl: boolean
  onStart: () => void
  onComplete: () => void
  /** Shown only while started and not completed; opens confirmation before undo. */
  onUndoStart?: () => void
  blockCompleteReason?: string | null
}) {
  const { employees } = useAppData()
  const crew = formatAssigneesSummary(job.assignees, employees)

  const started = Boolean(job.work_started_at)
  const completed = Boolean(job.work_completed_at)
  const terminal = job.status === 'completed' || job.status === 'canceled'

  const phase = jobActionPhase(job, started, completed)
  useLiveWorkClockTick(phase === 'in_progress')

  const [undoOpen, setUndoOpen] = useState(false)

  const elapsedLive =
    started && !completed && job.work_started_at
      ? formatLiveElapsedSince(job.work_started_at)
      : null
  const elapsedFinal = formatWorkDuration(job.work_started_at, job.work_completed_at)

  const showUndo =
    Boolean(onUndoStart) && started && !completed && canControl && !terminal

  const statusPillClass =
    phase === 'not_started'
      ? 'bg-slate-100 text-slate-700 ring-slate-200/90 dark:bg-slate-800 dark:text-gray-200 dark:ring-slate-600'
      : phase === 'in_progress'
        ? 'bg-emerald-100 text-emerald-900 ring-emerald-200/80 dark:bg-emerald-950/80 dark:text-emerald-100 dark:ring-emerald-800/80'
        : phase === 'completed'
          ? 'bg-slate-200/90 text-slate-800 ring-slate-300/80 dark:bg-slate-700 dark:text-gray-100 dark:ring-slate-600'
          : 'bg-amber-100 text-amber-950 ring-amber-200/80 dark:bg-amber-950/50 dark:text-amber-100 dark:ring-amber-900/50'

  const statusLabel =
    phase === 'not_started'
      ? 'Not started'
      : phase === 'in_progress'
        ? 'In progress'
        : phase === 'completed'
          ? 'Completed'
          : 'Canceled'

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">
            Scheduled window
          </p>
          <p className="text-base font-semibold tabular-nums text-gray-900 dark:text-white">
            {formatDisplayDate(job.date)}
          </p>
          <p className="text-sm tabular-nums text-slate-600 dark:text-gray-400">
            {job.start_time} – {job.end_time}
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <span
            className={`inline-flex w-fit shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide ring-1 ring-inset ${statusPillClass}`}
          >
            {statusLabel}
          </span>
          <div className="min-w-0 sm:text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">
              Crew
            </p>
            <div className="mt-1.5 flex min-w-0 items-start gap-3">
              {!crew.unassigned ? (
                <CrewFacepile assigneeIds={job.assignees} employees={employees} size="md" className="pt-0.5" />
              ) : null}
              <p className="min-w-0 max-w-[20rem] text-base font-semibold leading-snug text-gray-900 dark:text-white">
                {crew.unassigned ? 'Unassigned' : crew.summary}
              </p>
            </div>
          </div>
        </div>
      </div>

      {phase === 'not_started' ? (
        <p className="mt-4 text-sm text-slate-600 dark:text-gray-400">
          Tap <span className="font-semibold text-slate-800 dark:text-gray-200">Start job</span> when work begins on site.
        </p>
      ) : null}

      {phase === 'in_progress' ? (
        <p className="mt-4 text-sm text-emerald-900/85 dark:text-emerald-200/85">
          Clock is running — finish tasks, then tap <span className="font-semibold">Complete job</span> when done.
        </p>
      ) : null}

      {phase === 'completed' ? (
        <p className="mt-4 text-sm text-slate-600 dark:text-gray-400">
          This job is closed. Recorded times are shown below.
        </p>
      ) : null}

      {phase === 'canceled' ? (
        <p className="mt-4 text-sm text-amber-900/70 dark:text-amber-200/80">This job was canceled.</p>
      ) : null}

      {started ? (
        <div className="mt-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/35">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-900/80 dark:text-emerald-300/90">
            {completed ? 'Time on this job' : 'Elapsed on this job'}
          </p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <p
              className="text-lg font-bold tabular-nums text-emerald-950 dark:text-emerald-100"
              aria-live="polite"
            >
              {completed && elapsedFinal ? elapsedFinal : elapsedLive ?? '—'}
            </p>
            <span className="text-xs font-medium text-emerald-800/80 dark:text-emerald-300/75">
              {completed ? 'total' : 'updates live'}
            </span>
          </div>
        </div>
      ) : null}

      {canControl && !terminal ? (
        <div className="mt-5 flex flex-col gap-3">
          {phase === 'not_started' ? (
            <Button
              type="button"
              className="min-h-[52px] w-full rounded-2xl text-base font-semibold shadow-sm shadow-emerald-900/10 dark:shadow-emerald-950/40"
              onClick={onStart}
            >
              Start job
            </Button>
          ) : null}
          {phase === 'in_progress' ? (
            <>
              <Button
                type="button"
                className="min-h-[52px] w-full rounded-2xl text-base font-semibold shadow-sm shadow-emerald-900/10 dark:shadow-emerald-950/40"
                onClick={onComplete}
              >
                Complete job
              </Button>
              {showUndo ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-[48px] w-full rounded-2xl border border-slate-200/90 text-base font-medium text-slate-700 dark:border-slate-600 dark:text-gray-200"
                  onClick={() => setUndoOpen(true)}
                >
                  Undo start
                </Button>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}

      {blockCompleteReason ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium leading-snug text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
          {blockCompleteReason}
        </p>
      ) : null}

      <Modal
        open={undoOpen}
        title="Undo job start?"
        description="This will remove the recorded start time."
        onClose={() => setUndoOpen(false)}
        children={null}
        footer={
          <>
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => setUndoOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => {
                onUndoStart?.()
                setUndoOpen(false)
              }}
            >
              Undo start
            </Button>
          </>
        }
      />
    </section>
  )
}
