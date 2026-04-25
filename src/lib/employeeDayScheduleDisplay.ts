import type { EmployeeDaySchedule, EmployeeDayScheduleStatus } from '../types/employeeSchedule'

/** Days with no explicit row are treated as a normal working day. */
export function effectiveDayStatus(
  row: EmployeeDaySchedule | undefined,
): EmployeeDayScheduleStatus {
  return row?.status ?? 'working'
}

export function isAbsenceStatus(status: EmployeeDayScheduleStatus): boolean {
  return status === 'off' || status === 'vacation' || status === 'sick' || status === 'unavailable'
}

/** Job assigned on a day marked off / PTO / sick / unavailable. */
export function isScheduleConflict(
  status: EmployeeDayScheduleStatus,
  jobCount: number,
): boolean {
  return jobCount > 0 && isAbsenceStatus(status)
}

export const DAY_STATUS_LABEL: Record<EmployeeDayScheduleStatus, string> = {
  working: 'Working',
  off: 'Off',
  vacation: 'Vacation',
  sick: 'Sick',
  unavailable: 'Unavailable',
}

/** Status chip inside day cells (absence + “Available”). */
export function dayStatusBadgeClass(status: EmployeeDayScheduleStatus): string {
  switch (status) {
    case 'working':
      return 'border border-emerald-300/60 bg-emerald-50/80 text-emerald-900 dark:border-emerald-700/60 dark:bg-emerald-950/55 dark:text-emerald-100'
    case 'off':
      return 'border border-slate-300/80 bg-slate-100 text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100'
    case 'vacation':
      return 'border border-violet-300/70 bg-violet-50 text-violet-900 dark:border-violet-700/60 dark:bg-violet-950/50 dark:text-violet-100'
    case 'sick':
      return 'border border-rose-300/70 bg-rose-50 text-rose-900 dark:border-rose-800/60 dark:bg-rose-950/45 dark:text-rose-100'
    case 'unavailable':
      return 'border border-amber-300/70 bg-amber-50 text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100'
  }
}

/** Subtle “Available” when working and no jobs — lighter than absence chips. */
export function availableDayBadgeClass(): string {
  return 'border border-dashed border-emerald-400/50 bg-emerald-50/40 text-emerald-800/90 dark:border-emerald-700/50 dark:bg-emerald-950/30 dark:text-emerald-200/90'
}

/** Full-cell background for absence days (scan down columns). */
export function dayCellStatusWash(status: EmployeeDayScheduleStatus): string {
  if (!isAbsenceStatus(status)) return ''
  switch (status) {
    case 'off':
      return 'bg-slate-100/80 dark:bg-slate-900/70'
    case 'vacation':
      return 'bg-violet-50/70 dark:bg-violet-950/30'
    case 'sick':
      return 'bg-rose-50/65 dark:bg-rose-950/28'
    case 'unavailable':
      return 'bg-amber-50/60 dark:bg-amber-950/25'
    default:
      return ''
  }
}

/** Strong left edge so status type is scannable from the gutter. */
export function dayCellLeftAccent(status: EmployeeDayScheduleStatus): string {
  if (!isAbsenceStatus(status)) {
    return 'border-l-[3px] border-l-emerald-500/35 dark:border-l-emerald-500/30'
  }
  switch (status) {
    case 'off':
      return 'border-l-[3px] border-l-slate-500 dark:border-l-slate-400'
    case 'vacation':
      return 'border-l-[3px] border-l-violet-500 dark:border-l-violet-400'
    case 'sick':
      return 'border-l-[3px] border-l-rose-500 dark:border-l-rose-400'
    case 'unavailable':
      return 'border-l-[3px] border-l-amber-500 dark:border-l-amber-400'
    default:
      return ''
  }
}

/** When a job conflicts with PTO — subtle ring so absence color still reads. */
export function conflictCellChromeClasses(): string {
  return 'ring-1 ring-inset ring-amber-500/55 dark:ring-amber-400/45'
}

/** Job row on a normal working day — high readability. */
export function workingDayJobCardClass(): string {
  return 'border border-slate-200/95 bg-white shadow-sm hover:border-emerald-400/70 hover:bg-emerald-50/40 dark:border-slate-600 dark:bg-slate-800/95 dark:hover:border-emerald-600/55 dark:hover:bg-emerald-950/35'
}

/** Job row when it conflicts with time off — accent bar, neutral body. */
export function conflictJobCardClass(): string {
  return 'border border-slate-200/90 bg-white shadow-sm ring-1 ring-amber-500/25 dark:border-slate-600 dark:bg-slate-900/95 dark:ring-amber-500/20'
}

export function formatOptionalDayTimeWindow(
  start: string | null | undefined,
  end: string | null | undefined,
): string | null {
  const s = start?.trim()
  const e = end?.trim()
  if (!s && !e) return null
  if (s && e) return `${s}–${e}`
  return s ?? e ?? null
}
