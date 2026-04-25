import {
  addMonths,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { useMemo } from 'react'
import { useAppData } from '../../hooks/useAppData'
import { formatDisplayDate } from '../../lib/format'
import {
  DAY_STATUS_LABEL,
  availableDayBadgeClass,
  conflictCellChromeClasses,
  conflictJobCardClass,
  dayCellLeftAccent,
  dayCellStatusWash,
  dayStatusBadgeClass,
  effectiveDayStatus,
  formatOptionalDayTimeWindow,
  isScheduleConflict,
  isAbsenceStatus,
  workingDayJobCardClass,
} from '../../lib/employeeDayScheduleDisplay'
import { CrewAssignmentInline } from '../ui/CrewFacepile'
import type { EmployeeDaySchedule, Job } from '../../types'
import { cal } from '../calendar/calendarSurfaces'

export function MonthCalendar({
  jobs,
  view,
  onViewChange,
  onJobClick,
  onDayAddClick,
  highlightedDateIso,
  showUnassignedLegend = true,
  daySchedules,
}: {
  jobs: Job[]
  view: Date
  onViewChange: (d: Date) => void
  onJobClick: (jobId: string) => void
  onDayAddClick?: (iso: string) => void
  highlightedDateIso?: string | null
  showUnassignedLegend?: boolean
  daySchedules?: EmployeeDaySchedule[]
}) {
  const { employees } = useAppData()
  const scheduleMode = daySchedules !== undefined
  const monthLabel = format(view, 'MMMM yyyy')

  const days = useMemo(() => {
    const monthStart = startOfMonth(view)
    const monthEnd = new Date(view.getFullYear(), view.getMonth() + 1, 0)
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    return eachDayOfInterval({ start: gridStart, end: gridEnd })
  }, [view])

  const jobsByDate = useMemo(() => {
    const m = new Map<string, Job[]>()
    for (const j of jobs) {
      const list = m.get(j.date) ?? []
      list.push(j)
      m.set(j.date, list)
    }
    for (const [, list] of m) {
      list.sort((a, b) => a.start_time.localeCompare(b.start_time))
    }
    return m
  }, [jobs])

  const scheduleByDate = useMemo(() => {
    const m = new Map<string, EmployeeDaySchedule>()
    for (const r of daySchedules ?? []) {
      m.set(r.date, r)
    }
    return m
  }, [daySchedules])

  return (
    <>
      <div className={`flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4 ${cal.panel}`}>
        <div>
          <div className={cal.sectionLabel}>Month</div>
          <div className={`text-lg font-semibold ${cal.textPrimary}`}>{monthLabel}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={cal.navMonthArrow}
            onClick={() => onViewChange(subMonths(view, 1))}
            aria-label="Previous month"
          >
            ←
          </button>
          <button
            type="button"
            className="inline-flex min-h-[2.5rem] items-center justify-center rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            onClick={() => onViewChange(startOfMonth(new Date()))}
          >
            Today
          </button>
          <button
            type="button"
            className={cal.navMonthArrow}
            onClick={() => onViewChange(addMonths(view, 1))}
            aria-label="Next month"
          >
            →
          </button>
        </div>
      </div>

      {scheduleMode ? (
        <div
          className={`rounded-xl border border-slate-200/85 bg-slate-50/90 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900/55`}
        >
          <p className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] ${cal.textMuted}`}>
            Day status
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3 lg:flex lg:flex-wrap lg:gap-x-5 lg:gap-y-2">
            <span className={`inline-flex items-center gap-2 text-[11px] font-medium ${cal.textBody}`}>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500 shadow-sm" aria-hidden />
              Working
            </span>
            <span className={`inline-flex items-center gap-2 text-[11px] font-medium ${cal.textBody}`}>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-slate-400" aria-hidden />
              Off
            </span>
            <span className={`inline-flex items-center gap-2 text-[11px] font-medium ${cal.textBody}`}>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-violet-500" aria-hidden />
              Vacation
            </span>
            <span className={`inline-flex items-center gap-2 text-[11px] font-medium ${cal.textBody}`}>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-rose-500" aria-hidden />
              Sick
            </span>
            <span className={`inline-flex items-center gap-2 text-[11px] font-medium ${cal.textBody}`}>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
              Unavailable
            </span>
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-amber-800 dark:text-amber-200/95">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-amber-500 bg-transparent"
                aria-hidden
              />
              Job vs time off
            </span>
          </div>
        </div>
      ) : showUnassignedLegend ? (
        <div className={`flex flex-wrap gap-3 text-xs ${cal.textBody}`}>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-900/20 dark:shadow-emerald-950/40" aria-hidden />
            Assigned job
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-900/15" aria-hidden />
            Unassigned
          </span>
        </div>
      ) : (
        <p className={`text-xs ${cal.textMuted}`}>Only jobs assigned to you are shown.</p>
      )}

      <div className={cal.gridFrame}>
        <div className="min-w-[720px]">
          <div className={cal.weekdayHeader}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="px-2 py-2.5">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const iso = format(day, 'yyyy-MM-dd')
              const inMonth = isSameMonth(day, view)
              const list = jobsByDate.get(iso) ?? []
              const today = isToday(day)
              const dow = day.getDay()
              const weekend = dow === 0 || dow === 6

              const row = scheduleByDate.get(iso)
              const effective = effectiveDayStatus(row)
              const absence = scheduleMode && inMonth && isAbsenceStatus(effective)
              const conflict = scheduleMode && isScheduleConflict(effective, list.length)

              let bg: string = !inMonth ? cal.dayOutMonth : weekend ? cal.dayInWeekend : cal.dayInWeekday
              if (scheduleMode && inMonth && absence) {
                bg = dayCellStatusWash(effective)
              }

              const leftAccent = scheduleMode && inMonth ? dayCellLeftAccent(effective) : ''
              const conflictChrome = conflict && inMonth ? conflictCellChromeClasses() : ''

              const dayNumClass = today
                ? cal.dayNumToday
                : inMonth
                  ? 'text-slate-800 dark:text-slate-100'
                  : 'text-slate-400 dark:text-slate-500'

              const addLabel = `Add job on ${formatDisplayDate(iso)}`
              const schedulingFocus = Boolean(onDayAddClick) && highlightedDateIso === iso
              const todayRing = today && inMonth && !schedulingFocus ? cal.todayRing : ''

              const timeWindow = formatOptionalDayTimeWindow(row?.start_time, row?.end_time)

              const showStatusRow = scheduleMode && inMonth
              const showAvailableChip = showStatusRow && effective === 'working' && list.length === 0
              const showAbsenceChip = showStatusRow && effective !== 'working'
              const hasJobs = list.length > 0

              const cellMinH = scheduleMode ? 'min-h-[138px]' : ''

              return (
                <div
                  key={iso}
                  className={
                    onDayAddClick
                      ? `${cal.dayCellChromeSm} ${cellMinH} relative flex flex-col ${cal.dayCellInteractive} ${bg} ${leftAccent} ${conflictChrome} ${
                          schedulingFocus ? cal.daySchedulingFocus : todayRing
                        }`
                      : `${cal.dayCellChromeSm} ${cellMinH} relative flex flex-col ${bg} ${leftAccent} ${conflictChrome} ${today && inMonth ? cal.todayRing : ''}`
                  }
                  onClick={onDayAddClick ? () => onDayAddClick(iso) : undefined}
                  aria-label={onDayAddClick ? addLabel : undefined}
                >
                  {onDayAddClick ? (
                    <span className={cal.dayAddHint} aria-hidden>
                      +
                    </span>
                  ) : null}

                  <div className="relative z-[1] flex items-start justify-between gap-1">
                    <div
                      className={`flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-full text-[13px] font-semibold ${
                        onDayAddClick
                          ? dayNumClass
                          : today
                            ? cal.dayNumToday
                            : inMonth
                              ? cal.dayNumInRead
                              : cal.dayNumOutRead
                      }`}
                    >
                      {format(day, 'd')}
                    </div>
                    {conflict && inMonth ? (
                      <span
                        className="max-w-[min(100%,5.5rem)] truncate rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase leading-tight tracking-wide text-amber-950 dark:bg-amber-950/70 dark:text-amber-100"
                        title="Job assigned on a day marked away"
                      >
                        Conflict
                      </span>
                    ) : null}
                  </div>

                  {showStatusRow ? (
                    <div className="relative z-[1] mt-1 min-h-[1.25rem] flex-1 space-y-1">
                      {showAvailableChip ? (
                        <span
                          className={`inline-flex max-w-full rounded px-1.5 py-0.5 text-[10px] font-semibold leading-tight ${availableDayBadgeClass()}`}
                        >
                          Available
                        </span>
                      ) : null}
                      {showAbsenceChip ? (
                        <div className="space-y-0.5">
                          <span
                            className={`inline-flex max-w-full rounded px-1.5 py-0.5 text-[10px] font-bold leading-tight tracking-wide ${dayStatusBadgeClass(effective)}`}
                          >
                            {DAY_STATUS_LABEL[effective]}
                          </span>
                          {timeWindow && absence ? (
                            <p className="truncate text-[10px] leading-tight text-slate-600 dark:text-slate-400">
                              {timeWindow}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div
                    className={`relative z-[1] mt-auto space-y-1.5 pt-1 ${
                      hasJobs && showStatusRow && (showAvailableChip || showAbsenceChip)
                        ? 'border-t border-slate-200/60 dark:border-slate-700/70'
                        : ''
                    }`}
                  >
                    {list.map((j) => {
                      const unassigned = j.assignees.length === 0
                      const timeLine = `${j.start_time}–${j.end_time}`
                      return (
                        <button
                          key={j.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onJobClick(j.id)
                          }}
                          className={`w-full rounded-lg px-2 py-1.5 text-left text-xs transition ${
                            conflict
                              ? `${conflictJobCardClass()} border-l-[3px] border-l-amber-500`
                              : unassigned
                                ? 'border border-amber-200/90 bg-amber-50/90 hover:border-amber-300 dark:border-amber-700/65 dark:bg-slate-800 dark:hover:border-amber-500/75'
                                : workingDayJobCardClass()
                          }`}
                        >
                          <div className={`truncate font-semibold leading-snug ${cal.textPrimary}`}>{j.title}</div>
                          {!unassigned && scheduleMode && inMonth ? (
                            <p className="mt-0.5 text-[10px] font-medium tabular-nums text-slate-500 dark:text-slate-400">
                              {timeLine}
                            </p>
                          ) : null}
                          <div className="mt-1 min-w-0">
                            <CrewAssignmentInline assigneeIds={j.assignees} employees={employees} dense />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
