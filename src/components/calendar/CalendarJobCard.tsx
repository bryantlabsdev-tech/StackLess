import { useAppData } from '../../hooks/useAppData'
import { colorForEmployeeId } from '../../lib/employeeColors'
import {
  crewNamesSentence,
  formatAssigneesSummary,
  primaryAssigneeIdForColor,
} from '../../lib/jobAssignees'
import { formatJobValue, optionalJobValue } from '../../lib/jobValue'
import { CrewFacepile } from '../ui/CrewFacepile'
import { JOB_STATUS_LABELS, type Job, type JobStatus } from '../../types'
import { cal } from './calendarSurfaces'

function statusAccent(status: JobStatus): string {
  switch (status) {
    case 'unassigned':
      return 'bg-amber-500 dark:bg-amber-400'
    case 'scheduled':
      return 'bg-sky-500 dark:bg-sky-400'
    case 'in_progress':
      return 'bg-violet-500 dark:bg-violet-400'
    case 'completed':
      return 'bg-slate-400 dark:bg-slate-500'
    case 'needs_verification':
      return 'bg-amber-500 dark:bg-amber-400'
    case 'verified':
      return 'bg-teal-500 dark:bg-teal-400'
    case 'canceled':
      return 'bg-red-400 dark:bg-red-500'
  }
}

export function CalendarJobCard({
  job,
  onClick,
}: {
  job: Job
  onClick: () => void
}) {
  const { employees } = useAppData()
  const primaryId = primaryAssigneeIdForColor(job.assignees)
  const colors = colorForEmployeeId(primaryId)
  const crew = formatAssigneesSummary(job.assignees, employees)
  const unassigned = crew.unassigned
  const crewTitle = crewNamesSentence(job.assignees, employees)
  const value = optionalJobValue(job)
  const cardTitle = [job.title, job.customer_name, crewTitle || 'Unassigned'].filter(Boolean).join(' — ')

  return (
    <button
      type="button"
      data-job-id={job.id}
      title={cardTitle}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`group relative w-full cursor-pointer rounded-lg border text-left shadow-sm transition hover:-translate-y-px hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/45 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] dark:hover:shadow-lg dark:hover:shadow-black/35 ${colors.soft} dark:!bg-slate-800 ${colors.border} dark:border-slate-700 ring-1 ${colors.ring} dark:ring-slate-600/35`}
    >
      {job.assignees.length >= 2 ? (
        <span
          className="absolute left-0 top-0 flex h-full w-[3px] flex-col overflow-hidden rounded-l-lg"
          aria-hidden
        >
          <span className={`min-h-[50%] flex-1 ${colorForEmployeeId(job.assignees[0]).strip}`} />
          <span className={`min-h-[50%] flex-1 ${colorForEmployeeId(job.assignees[1]).strip}`} />
        </span>
      ) : (
        <span
          className={`absolute left-0 top-0 h-full w-[3px] rounded-l-lg ${colors.strip}`}
          aria-hidden
        />
      )}
      <div className="pl-3 pr-1.5 py-1.5">
        <div className="flex items-start justify-between gap-1.5">
          <div className="min-w-0 flex-1">
            <div className={`truncate text-[12px] font-semibold leading-tight tracking-tight ${cal.textPrimary}`}>
              {job.title}
            </div>
            <div className={`mt-0.5 truncate text-[11px] leading-snug ${cal.textMuted}`}>{job.customer_name}</div>
          </div>
          <span
            className={`mt-0.5 h-2 w-2 shrink-0 rounded-full shadow-sm ${statusAccent(job.status)}`}
            title={JOB_STATUS_LABELS[job.status]}
          />
        </div>
        <div className={`mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] ${cal.textMuted}`}>
          <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">
            {job.start_time}–{job.end_time}
          </span>
          {value == null ? null : (
            <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">
              {formatJobValue(value)}
            </span>
          )}
          {unassigned ? (
            <span className="max-w-[100%] truncate rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none bg-amber-100/95 text-amber-950 ring-1 ring-amber-200/90 dark:bg-amber-950/60 dark:text-amber-100 dark:ring-amber-800">
              Unassigned
            </span>
          ) : null}
        </div>
        {!unassigned ? (
          <div className="mt-1.5 flex min-w-0 items-center gap-1.5 border-t border-slate-200/70 pt-1.5 dark:border-slate-600/50">
            <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Crew
            </span>
            <CrewFacepile assigneeIds={job.assignees} employees={employees} size="xs" className="shrink-0" />
            <span className="min-w-0 truncate text-[10px] font-medium leading-tight text-slate-700 dark:text-slate-200">
              {crew.summary}
            </span>
          </div>
        ) : null}
      </div>
    </button>
  )
}
