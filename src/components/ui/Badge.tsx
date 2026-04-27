import type { JobStatus } from '../../types'
import { JOB_STATUS_LABELS } from '../../types'

const jobStyles: Record<JobStatus, string> = {
  unassigned:
    'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/25',
  scheduled:
    'bg-blue-50 text-blue-800 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-200 dark:ring-blue-500/25',
  in_progress:
    'bg-violet-50 text-violet-800 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-200 dark:ring-violet-500/25',
  completed:
    'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/25',
  needs_verification:
    'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/25',
  verified:
    'bg-teal-50 text-teal-800 ring-teal-200 dark:bg-teal-500/10 dark:text-teal-200 dark:ring-teal-500/25',
  canceled:
    'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-200 dark:ring-red-500/25',
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={`inline-flex max-w-full items-center whitespace-normal rounded-full px-2.5 py-1 text-xs font-semibold leading-snug ring-1 ring-inset ${jobStyles[status]}`}
    >
      {JOB_STATUS_LABELS[status]}
    </span>
  )
}

export function EmployeeStatusBadge({ status }: { status: 'active' | 'inactive' }) {
  const cls =
    status === 'active'
      ? 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/25'
      : 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-white/[0.04] dark:text-slate-400 dark:ring-white/10'
  return (
    <span
      className={`inline-flex max-w-full items-center whitespace-normal rounded-full px-2.5 py-1 text-xs font-semibold leading-snug ring-1 ring-inset capitalize ${cls}`}
    >
      {status}
    </span>
  )
}

export function AssigneeBadge({
  summary,
  unassigned,
}: {
  /** Display text: one name, “A & B”, or “3 crew members”. */
  summary: string
  unassigned?: boolean
}) {
  if (unassigned || !summary.trim()) {
    return (
      <span className="inline-flex max-w-full items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/25">
        Unassigned
      </span>
    )
  }
  return (
    <span
      className="inline-flex max-w-full items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-900 ring-1 ring-inset ring-blue-200 dark:bg-blue-500/10 dark:text-blue-200 dark:ring-blue-500/25"
      title={summary}
    >
      <span className="truncate">{summary}</span>
    </span>
  )
}
