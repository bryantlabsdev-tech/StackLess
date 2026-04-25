import { colorForEmployeeId } from '../../lib/employeeColors'
import { crewNamesSentence, formatAssigneesSummary } from '../../lib/jobAssignees'
import { initialsFromName } from '../../lib/initials'
import type { Employee } from '../../types'
import { AssigneeBadge } from './Badge'

const sizeClass = {
  xs: 'h-4 w-4 min-h-4 min-w-4 text-[8px]',
  sm: 'h-5 w-5 min-h-5 min-w-5 text-[9px]',
  md: 'h-6 w-6 min-h-6 min-w-6 text-[10px]',
} as const

/**
 * Overlapping initials for each assignee — makes multi-crew obvious at a glance.
 * Ring separates stacks on light and dark backgrounds.
 */
export function CrewFacepile({
  assigneeIds,
  employees,
  maxVisible = 4,
  size = 'sm',
  className = '',
  /** Strong ring on this id — e.g. selected employee in Team crew modal. */
  highlightEmployeeId,
}: {
  assigneeIds: string[]
  employees: Pick<Employee, 'id' | 'full_name'>[]
  /** Show this many avatars, then +N. */
  maxVisible?: number
  size?: keyof typeof sizeClass
  className?: string
  highlightEmployeeId?: string | null
}) {
  if (assigneeIds.length === 0) return null

  const resolved = assigneeIds.map((id) => {
    const e = employees.find((x) => x.id === id)
    const name = e?.full_name?.trim() ?? ''
    return {
      id,
      initials: name ? initialsFromName(name) : '?',
      ariaName: name || 'Crew member',
    }
  })

  const visible = resolved.slice(0, maxVisible)
  const overflow = resolved.length - visible.length
  const sc = sizeClass[size]
  const label = crewNamesSentence(assigneeIds, employees)

  return (
    <div
      className={`flex items-center ${className}`}
      role="group"
      aria-label={label ? `Crew: ${label}` : 'Crew'}
      title={label || undefined}
    >
      <div className="flex items-center -space-x-1.5">
        {visible.map((p, i) => {
          const colors = colorForEmployeeId(p.id)
          const hi = highlightEmployeeId != null && p.id === highlightEmployeeId
          return (
            <span
              key={`${p.id}-${i}`}
              className={`relative z-[1] inline-flex items-center justify-center rounded-full font-bold tabular-nums text-white shadow-sm ${sc} ${colors.strip} ${
                hi
                  ? 'z-[2] ring-2 ring-emerald-400 ring-offset-2 ring-offset-white dark:ring-emerald-300/90 dark:ring-offset-slate-950'
                  : 'ring-[1.5px] ring-white dark:ring-slate-900'
              }`}
            >
              {p.initials}
            </span>
          )
        })}
        {overflow > 0 ? (
          <span
            className={`relative inline-flex items-center justify-center rounded-full bg-slate-600 font-bold tabular-nums text-white shadow-sm ring-[1.5px] ring-white dark:bg-slate-500 dark:ring-slate-900 ${sc}`}
          >
            +{overflow}
          </span>
        ) : null}
      </div>
    </div>
  )
}

/** Facepile + summary badge — use in tables and modals for consistent crew display. */
export function CrewAssignmentInline({
  assigneeIds,
  employees,
  dense,
}: {
  assigneeIds: string[]
  employees: Pick<Employee, 'id' | 'full_name'>[]
  /** Tighter spacing and smaller avatars. */
  dense?: boolean
}) {
  const crew = formatAssigneesSummary(assigneeIds, employees)
  if (crew.unassigned) {
    return <AssigneeBadge summary="" unassigned />
  }
  return (
    <div
      className={`flex min-w-0 flex-wrap items-center ${dense ? 'gap-1.5' : 'gap-2'}`}
      title={crewNamesSentence(assigneeIds, employees)}
    >
      <CrewFacepile
        assigneeIds={assigneeIds}
        employees={employees}
        size={dense ? 'xs' : 'sm'}
        className="shrink-0"
      />
      <AssigneeBadge summary={crew.summary} unassigned={false} />
    </div>
  )
}
