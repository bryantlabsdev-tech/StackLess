import {
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { useMemo, useState } from 'react'
import type { Job } from '../../types'
import { formatDisplayDate } from '../../lib/format'
import { useAppData } from '../../hooks/useAppData'
import { JobStatusBadge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { CrewAssignmentInline } from '../ui/CrewFacepile'
import { CalendarJobCard } from './CalendarJobCard'
import { cal } from './calendarSurfaces'

const MAX_VISIBLE = 3
const MAX_MOBILE_DOTS = 3

function MobileScheduleJobButton({
  job,
  employees,
  onClick,
  showDate,
}: {
  job: Job
  employees: ReturnType<typeof useAppData>['employees']
  onClick: () => void
  showDate?: boolean
}) {
  return (
    <button
      type="button"
      className="w-full touch-manipulation rounded-[18px] border border-slate-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.99] dark:border-[#1F2A36] dark:bg-[#151B23]"
      onClick={onClick}
    >
      <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            {showDate ? `${formatDisplayDate(job.date)} · ` : ''}
            {job.start_time}-{job.end_time}
          </p>
          <p className="mt-2 break-words text-base font-semibold leading-snug text-slate-950 dark:text-white">
            {job.title}
          </p>
          <p className="mt-1 break-words text-sm text-slate-600 dark:text-slate-300">
            {job.customer_name}
          </p>
        </div>
        <JobStatusBadge status={job.status} />
      </div>
      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/70">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Assigned crew
        </p>
        <CrewAssignmentInline assigneeIds={job.assignees} employees={employees} dense />
      </div>
    </button>
  )
}

export function CalendarGrid({
  view,
  jobs,
  onJobClick,
  onDayAddClick,
  highlightedDateIso,
  mobileViewMode = 'agenda',
}: {
  view: Date
  jobs: Job[]
  onJobClick: (jobId: string) => void
  onDayAddClick: (iso: string) => void
  /** When set (e.g. create modal open), that day gets a subtle scheduling highlight */
  highlightedDateIso?: string | null
  mobileViewMode?: 'month' | 'agenda'
}) {
  const { employees } = useAppData()
  const [selectedMobileDateIso, setSelectedMobileDateIso] = useState(() =>
    format(new Date(), 'yyyy-MM-dd'),
  )
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

  const hasAnyInMonth = useMemo(() => {
    return jobs.some((j) => isSameMonth(parseISO(j.date), view))
  }, [jobs, view])

  const agendaJobs = useMemo(() => {
    return jobs
      .filter((j) => isSameMonth(parseISO(j.date), view))
      .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
  }, [jobs, view])

  const selectedDayIso = isSameMonth(parseISO(selectedMobileDateIso), view)
    ? selectedMobileDateIso
    : format(startOfMonth(view), 'yyyy-MM-dd')

  const selectedDayJobs = jobsByDate.get(selectedDayIso) ?? []

  return (
    <div className="flex flex-col gap-3">
      {!hasAnyInMonth && jobs.length === 0 ? (
        <div className={`${cal.emptyStateCard} hidden md:flex`}>
          <div className={cal.iconTile}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M8 2v3M16 2v3M3.5 9.09h17M21 8.5V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8.5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className={`mt-3 text-base font-semibold ${cal.textPrimary}`}>No jobs scheduled</p>
          <p className={`mt-1.5 max-w-sm text-sm leading-snug ${cal.textMuted}`}>
            Once you create jobs, they&apos;ll appear here
          </p>
          <Button
            type="button"
            className="mt-5 rounded-xl px-5 font-semibold"
            onClick={() => onDayAddClick(format(new Date(), 'yyyy-MM-dd'))}
          >
            + Create Job
          </Button>
        </div>
      ) : !hasAnyInMonth ? (
        <div className="hidden rounded-xl border border-amber-200/90 bg-gradient-to-r from-amber-50/95 to-amber-50/40 px-3.5 py-3 text-sm text-amber-950 shadow-sm shadow-amber-900/[0.04] dark:border-amber-800/60 dark:from-amber-950/45 dark:to-amber-950/25 dark:text-amber-50 dark:shadow-amber-950/20 md:block">
          <span className="font-semibold">No jobs in this month</span>
          <span className="mt-0.5 block text-amber-900/85 dark:text-amber-200/90">
            Try another month or relax filters — crew toggles and search apply here too.
          </span>
        </div>
      ) : null}

      <div className="space-y-3 md:hidden">
        {mobileViewMode === 'month' ? (
          <>
            <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm ring-1 ring-slate-900/[0.03] dark:border-[#1F2A36] dark:bg-[#11161D] dark:ring-white/[0.04]">
              <div className="grid grid-cols-7 border-b border-slate-200/85 bg-slate-50 text-center text-[10px] font-bold uppercase tracking-[0.06em] text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="py-2">
                    {d.slice(0, 1)}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px bg-slate-100 dark:bg-slate-800">
                {days.map((day) => {
                  const iso = format(day, 'yyyy-MM-dd')
                  const inMonth = isSameMonth(day, view)
                  const today = isToday(day)
                  const selected = iso === selectedDayIso
                  const list = jobsByDate.get(iso) ?? []
                  const dots = list.slice(0, MAX_MOBILE_DOTS)

                  return (
                    <button
                      key={iso}
                      type="button"
                      className={`min-h-[52px] touch-manipulation px-1 py-1.5 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/70 ${
                        inMonth
                          ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100'
                          : 'bg-slate-50 text-slate-400 dark:bg-slate-950 dark:text-slate-600'
                      } ${selected ? 'ring-2 ring-inset ring-emerald-500 dark:ring-emerald-400' : ''}`}
                      onClick={() => setSelectedMobileDateIso(iso)}
                      aria-pressed={selected}
                      aria-label={`${formatDisplayDate(iso)}, ${list.length} scheduled ${
                        list.length === 1 ? 'job' : 'jobs'
                      }`}
                    >
                      <span
                        className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                          today
                            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/25 dark:bg-emerald-500'
                            : selected
                              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-100'
                              : ''
                        }`}
                      >
                        {format(day, 'd')}
                      </span>
                      <span className="mt-1 flex h-2 items-center justify-center gap-0.5">
                        {dots.map((j) => (
                          <span
                            key={j.id}
                            className="h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-400"
                            aria-hidden
                          />
                        ))}
                        {list.length > MAX_MOBILE_DOTS ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500" aria-hidden />
                        ) : null}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <section className="rounded-[18px] border border-slate-200 bg-slate-50/80 p-3 dark:border-[#1F2A36] dark:bg-slate-950/40">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                    Selected day
                  </p>
                  <p className="mt-0.5 text-base font-semibold text-slate-950 dark:text-white">
                    {formatDisplayDate(selectedDayIso)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-10 shrink-0 rounded-xl px-3 text-sm font-semibold"
                  onClick={() => onDayAddClick(selectedDayIso)}
                >
                  + Job
                </Button>
              </div>

              {selectedDayJobs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  No jobs scheduled for this day
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayJobs.map((job) => (
                    <MobileScheduleJobButton
                      key={job.id}
                      job={job}
                      employees={employees}
                      onClick={() => onJobClick(job.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        ) : agendaJobs.length === 0 ? (
          <div className={cal.emptyStateCard}>
            <p className={`text-base font-semibold ${cal.textPrimary}`}>No jobs in this month</p>
            <p className={`mt-1.5 max-w-sm text-sm leading-snug ${cal.textMuted}`}>
              Try another month or create a job for today.
            </p>
            <Button
              type="button"
              className="mt-5 rounded-xl px-5 font-semibold"
              onClick={() => onDayAddClick(format(new Date(), 'yyyy-MM-dd'))}
            >
              + Create Job
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {agendaJobs.map((job) => (
              <MobileScheduleJobButton
                key={job.id}
                job={job}
                employees={employees}
                onClick={() => onJobClick(job.id)}
                showDate
              />
            ))}
          </div>
        )}
      </div>

      <div className={`${cal.gridFrame} hidden md:block`}>
        <div className="min-w-[800px]">
          <div className={cal.weekdayHeader}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
              <div
                key={d}
                className={`px-2 py-2.5 ${i === 0 || i === 6 ? `${cal.textFaint}` : ''}`}
              >
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
              const visible = list.slice(0, MAX_VISIBLE)
              const more = list.length - visible.length
              const dow = day.getDay()
              const weekend = dow === 0 || dow === 6

              const bg =
                !inMonth
                  ? cal.dayOutMonth
                  : weekend
                    ? cal.dayInWeekend
                    : cal.dayInWeekday

              const dayNumClass = today
                ? cal.dayNumToday
                : inMonth
                  ? 'text-slate-800 dark:text-slate-100'
                  : 'text-slate-400 dark:text-slate-500'

              const label = `Add job on ${formatDisplayDate(iso)}`
              const schedulingFocus = highlightedDateIso === iso
              const todayRing = today && inMonth && !schedulingFocus ? cal.todayRing : ''

              return (
                <div
                  key={iso}
                  data-date={iso}
                  className={`${cal.dayCellChrome} ${cal.dayCellInteractive} ${bg} ${
                    schedulingFocus ? cal.daySchedulingFocus : todayRing
                  }`}
                  onClick={() => onDayAddClick(iso)}
                  aria-label={label}
                >
                  <span className={cal.dayAddHint} aria-hidden>
                    +
                  </span>
                  <div
                    className={`relative z-[1] mb-1.5 flex h-7 w-7 select-none items-center justify-center rounded-full text-[13px] font-semibold ${dayNumClass}`}
                  >
                    {format(day, 'd')}
                  </div>
                  <div className="relative z-[1] space-y-1">
                    {visible.map((j) => (
                      <CalendarJobCard
                        key={j.id}
                        job={j}
                        onClick={() => onJobClick(j.id)}
                      />
                    ))}
                    {more > 0 ? (
                      <div
                        className={`relative z-[1] ${cal.morePill} cursor-default`}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        +{more} more
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
