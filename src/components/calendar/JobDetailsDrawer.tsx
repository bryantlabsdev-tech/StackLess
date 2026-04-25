import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { JOB_STATUS_LABELS, type Job } from '../../types'
import { formatDisplayDate } from '../../lib/format'
import { Button } from '../ui/Button'

export function JobDetailsDrawer({
  job,
  open,
  onClose,
  onEdit,
  onDelete,
}: {
  job: Job | null
  open: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <button
        type="button"
        className="calendar-backdrop-enter fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-[3px] transition-opacity dark:bg-black/55"
        aria-label="Close details"
        onClick={onClose}
      />
      <aside
        className="calendar-drawer-enter fixed inset-y-0 right-0 z-50 flex h-dvh w-full max-w-md flex-col border-l border-slate-200/70 bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.04),-12px_0_40px_-8px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[inset_1px_0_0_0_rgba(255,255,255,0.04),-12px_0_48px_-8px_rgba(0,0,0,0.55)]"
        aria-hidden={!open}
        role="dialog"
        aria-modal="true"
        aria-labelledby="job-drawer-title"
      >
        {!job ? (
          <div className="flex flex-1 flex-col">
            <header className="flex items-center justify-between border-b border-slate-100 px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] dark:border-slate-800/90">
              <p className="text-sm font-semibold text-slate-800 dark:text-white">Job not found</p>
              <button
                type="button"
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                onClick={onClose}
                aria-label="Close"
              >
                ✕
              </button>
            </header>
            <div className="flex flex-1 items-center justify-center p-6 text-sm text-slate-600 dark:text-gray-400">
              It may have been deleted. Close and refresh the schedule.
            </div>
          </div>
        ) : (
          <JobDetailsBody job={job} onClose={onClose} onEdit={onEdit} onDelete={onDelete} />
        )}
      </aside>
    </>
  )
}

function JobDetailsBody({
  job,
  onClose,
  onEdit,
  onDelete,
}: {
  job: Job
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className="h-1 w-full shrink-0 bg-emerald-500"
        aria-hidden
      />
      <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-white px-5 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))] dark:border-slate-800/90 dark:bg-slate-900">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-gray-400">
            Job details
          </p>
          <h2
            id="job-drawer-title"
            className="mt-1.5 text-lg font-semibold leading-snug text-slate-900 dark:text-white"
          >
            {job.title}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950/45 dark:text-emerald-200 dark:ring-emerald-800"
            >
              Work order
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-800 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-gray-200 dark:ring-slate-700">
              {JOB_STATUS_LABELS[job.status]}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="min-h-11 min-w-11 rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
      </header>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5">
        <section className="space-y-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-gray-400">
            Customer
          </h3>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{job.customer_name}</p>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-gray-400">{job.address}</p>
        </section>

        <section className="grid grid-cols-2 gap-x-4 gap-y-4">
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-gray-400">
              Service
            </h3>
            <p className="mt-1.5 text-sm font-medium text-slate-900 dark:text-white">{job.service_type}</p>
          </div>
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-gray-400">
              Date
            </h3>
            <p className="mt-1.5 text-sm font-medium text-slate-900 dark:text-white">
              {formatDisplayDate(job.date)}
            </p>
          </div>
          <div className="col-span-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-gray-400">
              Time window
            </h3>
            <p className="mt-1.5 text-sm font-medium tabular-nums text-slate-900 dark:text-white">
              {job.start_time} – {job.end_time}
            </p>
          </div>
        </section>

        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-gray-400">
            Notes
          </h3>
          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-gray-300">
            {job.notes?.trim() ? job.notes : 'No notes for this job.'}
          </p>
        </section>

        <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-3 dark:border-slate-700 dark:bg-slate-800/60">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">
            Documentation
          </p>
          <Link
            to={`/jobs/${job.id}`}
            className="mt-2 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
            onClick={onClose}
          >
            Tasks, photos & checklist →
          </Link>
        </div>
      </div>

      <footer className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-slate-800/90 dark:bg-slate-950/80">
        <Button type="button" className="min-h-[44px] flex-1 rounded-xl font-semibold" onClick={onEdit}>
          Edit job
        </Button>
        <Button
          type="button"
          variant="danger"
          className="min-h-[44px] rounded-xl font-semibold"
          onClick={onDelete}
        >
          Delete
        </Button>
      </footer>
    </div>
  )
}
