import type { Employee } from '../types'
import type { Job, JobStatus } from '../types'

export type AssignmentFilter = 'all' | 'unassigned'

export type CalendarFilterState = {
  search: string
  status: JobStatus | 'all'
  serviceType: string
  hiddenEmployeeIds: Set<string>
  assignment: AssignmentFilter
}

export function filterCalendarJobs(
  jobs: Job[],
  f: CalendarFilterState,
  employees?: Employee[],
): Job[] {
  const q = f.search.trim().toLowerCase()
  return jobs.filter((j) => {
    if (f.assignment === 'unassigned' && j.assignees.length > 0) return false

    if (f.status !== 'all' && j.status !== f.status) return false

    if (f.serviceType && j.service_type !== f.serviceType) return false

    if (j.assignees.length > 0) {
      const allHidden = j.assignees.every((id) => f.hiddenEmployeeIds.has(id))
      if (allHidden) return false
    }

    if (!q) return true
    const assigneeHay = employees
      ? j.assignees.map((id) => employees.find((e) => e.id === id)?.full_name ?? '').join(' ')
      : ''
    const hay = [j.title, j.customer_name, j.service_type, j.address, assigneeHay, j.notes]
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })
}

export function isUnassignedJob(j: Job): boolean {
  return j.assignees.length === 0
}
