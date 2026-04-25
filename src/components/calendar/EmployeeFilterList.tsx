import type { Employee } from '../../types'
import { colorForEmployeeId } from '../../lib/employeeColors'
import { cal } from './calendarSurfaces'

export function EmployeeFilterList({
  employees,
  hiddenEmployeeIds,
  onToggle,
}: {
  employees: Employee[]
  hiddenEmployeeIds: Set<string>
  onToggle: (employeeId: string) => void
}) {
  const active = employees.filter((e) => e.status === 'active')

  if (active.length === 0) {
    return (
      <div
        className={`rounded-2xl border border-dashed border-slate-200/90 bg-slate-50/50 px-3.5 py-3.5 text-sm leading-snug dark:border-slate-700 dark:bg-slate-900/70 ${cal.textBody}`}
      >
        No active crew members yet. Add people under{' '}
        <span className={`font-semibold ${cal.textPrimary}`}>Team</span> to filter by assignee.
      </div>
    )
  }

  const anyHidden = active.some((e) => hiddenEmployeeIds.has(e.id))

  return (
    <div className={`${cal.panel} p-3.5`}>
      <div className="flex items-center justify-between gap-2">
        <p className={cal.sectionLabel}>Crew visibility</p>
        <button
          type="button"
          disabled={!anyHidden}
          className="text-[11px] font-semibold text-emerald-700 transition hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-40 dark:text-emerald-400 dark:hover:text-emerald-300"
          onClick={() => {
            for (const e of active) {
              if (hiddenEmployeeIds.has(e.id)) onToggle(e.id)
            }
          }}
        >
          Show all
        </button>
      </div>
      <p className={`mt-1 text-[12px] leading-snug ${cal.textMuted}`}>
        A job appears if <span className="font-semibold text-slate-700 dark:text-slate-300">any</span> of its crew
        is visible here. Multi-crew jobs show for everyone assigned. Unassigned work always stays visible.
      </p>
      <ul className="mt-2.5 max-h-48 space-y-0.5 overflow-y-auto overscroll-contain pr-0.5">
        {active.map((e) => {
          const visible = !hiddenEmployeeIds.has(e.id)
          const c = colorForEmployeeId(e.id)
          return (
            <li key={e.id}>
              <label
                className={`flex cursor-pointer items-center gap-2.5 rounded-lg border border-transparent px-1.5 py-1.5 transition hover:border-slate-200/90 hover:bg-slate-50/90 dark:hover:border-slate-700 dark:hover:bg-slate-800/90`}
              >
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0 dark:border-slate-600 dark:bg-slate-800 dark:ring-offset-slate-900"
                  checked={visible}
                  onChange={() => onToggle(e.id)}
                />
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full shadow-sm ${c.dot}`}
                  aria-hidden
                />
                <span className={`min-w-0 flex-1 truncate text-[13px] font-semibold ${cal.textPrimary}`}>
                  {e.full_name}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
