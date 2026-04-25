import type { Job } from '../../types'
import { formatDisplayDate } from '../../lib/format'
import { JobStatusBadge } from '../ui/Badge'

export function JobHeader({ job }: { job: Job }) {
  return (
    <header className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm shadow-slate-900/[0.04] dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="min-w-0 text-xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white sm:text-2xl">
          {job.title}
        </h1>
        <JobStatusBadge status={job.status} />
      </div>
      <p className="mt-2 text-sm font-medium tabular-nums text-slate-500 dark:text-gray-400">
        {formatDisplayDate(job.date)} · {job.start_time}–{job.end_time}
      </p>
      <p className="mt-3 text-base font-semibold text-slate-800 dark:text-gray-200">{job.customer_name}</p>
      <p className="mt-1 text-[15px] leading-relaxed text-slate-600 dark:text-gray-400">{job.address}</p>
    </header>
  )
}
