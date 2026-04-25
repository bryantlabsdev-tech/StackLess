import { JOB_STATUS_LABELS, type JobStatus } from '../../types'
import type { AssignmentFilter } from '../../lib/calendarFilters'
import { Button } from '../ui/Button'
import { cal } from './calendarSurfaces'

const STATUSES: (JobStatus | 'all')[] = [
  'all',
  'unassigned',
  'scheduled',
  'in_progress',
  'completed',
  'canceled',
]

export function FilterBar({
  status,
  onStatusChange,
  serviceType,
  serviceTypes,
  onServiceTypeChange,
  assignment,
  onAssignmentChange,
  onClear,
  hasActiveFilters,
}: {
  status: JobStatus | 'all'
  onStatusChange: (s: JobStatus | 'all') => void
  serviceType: string
  serviceTypes: string[]
  onServiceTypeChange: (s: string) => void
  assignment: AssignmentFilter
  onAssignmentChange: (a: AssignmentFilter) => void
  onClear: () => void
  hasActiveFilters: boolean
}) {
  return (
    <div
      className={`flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-4 ${cal.panelSoft}`}
    >
      <div className="min-w-0 flex-1">
        <p className={cal.sectionLabel}>Refine schedule</p>
        <div className="mt-2 grid flex-1 gap-2.5 sm:grid-cols-3">
          <label className={`flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide ${cal.textMuted}`}>
            Status
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value as JobStatus | 'all')}
              className={cal.select}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === 'all' ? 'All statuses' : JOB_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label className={`flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide ${cal.textMuted}`}>
            Service type
            <select
              value={serviceType}
              onChange={(e) => onServiceTypeChange(e.target.value)}
              className={cal.select}
            >
              <option value="">All services</option>
              {serviceTypes.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </label>
          <label className={`flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide ${cal.textMuted}`}>
            Assignment
            <select
              value={assignment}
              onChange={(e) => onAssignmentChange(e.target.value as AssignmentFilter)}
              className={cal.select}
            >
              <option value="all">All jobs</option>
              <option value="unassigned">Needs crew only</option>
            </select>
          </label>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        className="h-9 shrink-0 self-stretch rounded-xl px-3 text-sm font-semibold sm:self-auto"
        disabled={!hasActiveFilters}
        onClick={onClear}
      >
        Clear filters
      </Button>
    </div>
  )
}
