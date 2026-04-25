import type { Employee, Job } from '../types'

/** Migrate persisted jobs: `assignees[]` or legacy `assigned_employee_id`. */
export function migrateAssigneeIdsFromUnknown(job: unknown): string[] {
  if (!job || typeof job !== 'object') return []
  const o = job as Record<string, unknown>
  const arr = o.assignees
  if (Array.isArray(arr) && arr.length > 0) {
    return [...new Set(arr.filter((x): x is string => typeof x === 'string' && x.length > 0))]
  }
  const legacy = o.assigned_employee_id
  if (typeof legacy === 'string' && legacy.length > 0) return [legacy]
  return []
}

export function stripLegacyAssignFields<T extends Record<string, unknown>>(job: T): T {
  const { assigned_employee_id: _a, assigned_employee_name: _n, ...rest } = job
  return rest as T
}

/** Ordered display names for tooltips and full labels (skips unknown ids). */
export function crewNamesList(
  assigneeIds: string[],
  employees: Pick<Employee, 'id' | 'full_name'>[],
): string[] {
  return assigneeIds
    .map((id) => employees.find((e) => e.id === id)?.full_name?.trim())
    .filter((n): n is string => Boolean(n))
}

/** Comma-separated names for titles and aria-labels. */
export function crewNamesSentence(
  assigneeIds: string[],
  employees: Pick<Employee, 'id' | 'full_name'>[],
): string {
  const names = crewNamesList(assigneeIds, employees)
  return names.join(', ')
}

/** Short label for badges and cards. */
export function formatAssigneesSummary(
  assigneeIds: string[],
  employees: Pick<Employee, 'id' | 'full_name'>[],
): { summary: string; unassigned: boolean } {
  if (assigneeIds.length === 0) return { summary: '', unassigned: true }
  const names = crewNamesList(assigneeIds, employees)
  if (names.length === 0) {
    return { summary: `${assigneeIds.length} crew member${assigneeIds.length === 1 ? '' : 's'}`, unassigned: false }
  }
  if (names.length === 1) return { summary: names[0]!, unassigned: false }
  if (names.length === 2) return { summary: `${names[0]} & ${names[1]}`, unassigned: false }
  return {
    summary: `${names[0]} · ${names[1]} +${names.length - 2}`,
    unassigned: false,
  }
}

export function primaryAssigneeIdForColor(assigneeIds: string[]): string | null {
  return assigneeIds[0] ?? null
}

export function addAssigneeToJobPatch(job: Job, employeeId: string): Partial<Job> {
  if (job.assignees.includes(employeeId)) return {}
  const next = [...job.assignees, employeeId]
  let status = job.status
  if (status === 'unassigned') status = 'scheduled'
  return { assignees: next, status }
}

export function removeAssigneeFromJobPatch(job: Job, employeeId: string): Partial<Job> {
  const next = job.assignees.filter((id) => id !== employeeId)
  let status = job.status
  if (next.length === 0 && status !== 'canceled' && status !== 'completed') {
    status = 'unassigned'
  }
  return { assignees: next, status }
}

export function jobMatchesEmployeeFilter(
  job: Job,
  employeeId: string | 'all' | 'unassigned',
): boolean {
  if (employeeId === 'all') return true
  if (employeeId === 'unassigned') return job.assignees.length === 0
  return job.assignees.includes(employeeId)
}
