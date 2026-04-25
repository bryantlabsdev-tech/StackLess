import type { Job } from '../types'
import type { EmployeeDaySchedule } from '../types/employeeSchedule'
import {
  effectiveDayStatus,
  isAbsenceStatus,
  isScheduleConflict,
} from './employeeDayScheduleDisplay'

export type TodayOverviewKind =
  | 'inactive'
  | 'conflict'
  | 'working'
  | 'available'
  | 'off'
  | 'vacation'
  | 'sick'
  | 'unavailable'

export type TodaySummaryKey = 'working' | 'available' | 'away' | 'conflict'

export interface EmployeeTodayOverview {
  kind: TodayOverviewKind
  jobsToday: Job[]
  jobCount: number
  /** For aggregate counts — null when employee is inactive. */
  summaryKey: TodaySummaryKey | null
}

export function buildEmployeeTodayOverview(
  isActive: boolean,
  employeeId: string,
  todayIso: string,
  allJobs: Job[],
  allSchedules: EmployeeDaySchedule[],
): EmployeeTodayOverview {
  if (!isActive) {
    return { kind: 'inactive', jobsToday: [], jobCount: 0, summaryKey: null }
  }

  const row = allSchedules.find((r) => r.employee_id === employeeId && r.date === todayIso)
  const effective = effectiveDayStatus(row)
  const jobsToday = allJobs.filter(
    (j) => j.assignees.includes(employeeId) && j.date === todayIso,
  )
  const jobCount = jobsToday.length

  if (isScheduleConflict(effective, jobCount)) {
    return { kind: 'conflict', jobsToday, jobCount, summaryKey: 'conflict' }
  }

  if (isAbsenceStatus(effective)) {
    return {
      kind: effective,
      jobsToday,
      jobCount,
      summaryKey: 'away',
    }
  }

  if (jobCount > 0) {
    return { kind: 'working', jobsToday, jobCount, summaryKey: 'working' }
  }

  return { kind: 'available', jobsToday, jobCount, summaryKey: 'available' }
}

export function aggregateTodaySummary(overviews: EmployeeTodayOverview[]) {
  const out = { working: 0, available: 0, away: 0, conflicts: 0 }
  for (const o of overviews) {
    if (!o.summaryKey) continue
    if (o.summaryKey === 'working') out.working++
    else if (o.summaryKey === 'available') out.available++
    else if (o.summaryKey === 'away') out.away++
    else if (o.summaryKey === 'conflict') out.conflicts++
  }
  return out
}

/** Workload signal for admin cards — ≥3 jobs today = busy. */
export type CapacityLevel = 'available' | 'normal' | 'busy' | 'alert' | 'away' | 'inactive'

export function getCapacityLevel(o: EmployeeTodayOverview): CapacityLevel {
  if (o.kind === 'inactive') return 'inactive'
  if (o.kind === 'conflict') return 'alert'
  if (o.kind === 'available') return 'available'
  if (o.kind === 'working') {
    return o.jobCount >= 3 ? 'busy' : 'normal'
  }
  return 'away'
}
