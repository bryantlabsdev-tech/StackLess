import { formatPhotoTimestamp } from '../../lib/photoFormat'
import { formatLiveElapsedSince, formatWorkDuration } from '../../lib/workDuration'
import { useLiveWorkClockTick } from '../../hooks/useLiveWorkClockTick'
import type { Job } from '../../types'

export function TimeTracker({ job }: { job: Job }) {
  const started = Boolean(job.work_started_at)
  const completed = Boolean(job.work_completed_at)
  const inProgress = started && !completed

  useLiveWorkClockTick(inProgress)

  const durationFinal = formatWorkDuration(job.work_started_at, job.work_completed_at)
  const durationLive = inProgress && job.work_started_at ? formatLiveElapsedSince(job.work_started_at) : null

  return (
    <section className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 to-white p-4 shadow-sm dark:border-emerald-900/50 dark:from-emerald-950/40 dark:to-slate-900 sm:p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-900/85 dark:text-emerald-300/90">
        Work record
      </h2>
      <p className="mt-1 text-sm text-emerald-900/70 dark:text-emerald-200/70">
        Field clock-in and clock-out (separate from the scheduled window above).
      </p>
      <dl className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs font-medium text-slate-500 dark:text-gray-400">Job started</dt>
          <dd className="mt-1 text-base font-semibold tabular-nums text-gray-900 dark:text-white">
            {job.work_started_at ? formatPhotoTimestamp(job.work_started_at) : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500 dark:text-gray-400">Job finished</dt>
          <dd className="mt-1 text-base font-semibold tabular-nums text-gray-900 dark:text-white">
            {job.work_completed_at ? formatPhotoTimestamp(job.work_completed_at) : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500 dark:text-gray-400">
            {completed ? 'Total time' : inProgress ? 'Elapsed' : 'Total time'}
          </dt>
          <dd
            className="mt-1 text-base font-semibold tabular-nums text-gray-900 dark:text-white"
            aria-live="polite"
          >
            {completed && durationFinal
              ? durationFinal
              : inProgress && durationLive
                ? durationLive
                : '—'}
          </dd>
          {inProgress ? (
            <p className="mt-1 text-[11px] font-medium text-emerald-800/75 dark:text-emerald-300/70">
              Updates while the job is in progress
            </p>
          ) : null}
        </div>
      </dl>
    </section>
  )
}
