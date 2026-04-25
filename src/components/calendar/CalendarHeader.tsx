import { addMonths, format, startOfMonth } from 'date-fns'
import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'
import { cal } from './calendarSurfaces'

export type CalendarViewMode = 'month' | 'week' | 'day'

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.2-4.2" />
    </svg>
  )
}

export function CalendarHeader({
  view,
  onViewChange,
  viewMode,
  onViewModeChange,
  search,
  onSearchChange,
}: {
  view: Date
  onViewChange: (d: Date) => void
  viewMode: CalendarViewMode
  onViewModeChange: (m: CalendarViewMode) => void
  search: string
  onSearchChange: (v: string) => void
}) {
  const modes: { id: CalendarViewMode; label: string; hint: string; mobileHidden?: boolean }[] = [
    { id: 'month', label: 'Month', hint: 'Full month grid' },
    { id: 'week', label: 'Week', hint: 'Coming soon', mobileHidden: true },
    { id: 'day', label: 'Day / Agenda', hint: 'Mobile agenda list' },
  ]

  return (
    <header className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-600/30 dark:shadow-emerald-900/50"
              aria-hidden
            />
            <p className={cal.sectionLabel}>Schedule</p>
          </div>
          <p className={`mt-1.5 max-w-xl text-[15px] leading-snug ${cal.textBody}`}>
            Jobs, crew, customers, notes, and photos in one place — navigate by month below.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link to="/jobs" className={cal.secondaryLink}>
            All jobs
          </Link>
        </div>
      </div>

      <div className={`${cal.panel} p-3.5 sm:p-4`}>
        <div className="flex flex-col gap-4 lg:gap-5">
          <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <button
                type="button"
                className={cal.navIconButton}
                onClick={() => onViewChange(addMonths(view, -1))}
                aria-label="Previous month"
              >
                <ChevronLeft />
              </button>
              <Button
                type="button"
                variant="secondary"
                className="h-10 min-h-[40px] min-w-[4.25rem] rounded-xl px-3.5 text-sm font-semibold shadow-sm"
                onClick={() => onViewChange(startOfMonth(new Date()))}
              >
                Today
              </Button>
              <button
                type="button"
                className={cal.navIconButton}
                onClick={() => onViewChange(addMonths(view, 1))}
                aria-label="Next month"
              >
                <ChevronRight />
              </button>
            </div>

            <div className="min-w-0 flex-1 text-center lg:px-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-500">
                Current period
              </p>
              <p
                className="mt-0.5 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-[1.6rem]"
                aria-live="polite"
              >
                {format(view, 'MMMM yyyy')}
              </p>
            </div>

            <div
              className="flex min-h-[40px] flex-col gap-2.5 min-[480px]:flex-row min-[480px]:flex-wrap min-[480px]:items-center min-[480px]:justify-end lg:min-w-0 lg:flex-1"
              role="toolbar"
              aria-label="Search and calendar view"
            >
              <label className="relative min-h-[40px] w-full min-w-0 flex-1 sm:max-w-xs lg:max-w-[260px]">
                <span className="sr-only">Search jobs</span>
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                  <SearchIcon />
                </span>
                <input
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search jobs, customers…"
                  className={cal.searchInput}
                />
              </label>
              <div
                className={cal.segmentedTrack}
                role="group"
                aria-label="Calendar view mode"
              >
                {modes.map((m) => {
                  const active = viewMode === m.id
                  return (
                    <button
                      key={m.id}
                      type="button"
                      title={m.hint}
                      onClick={() => onViewModeChange(m.id)}
                      className={`min-h-[38px] min-w-[3rem] rounded-lg px-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
                        m.mobileHidden ? 'hidden md:inline-flex md:items-center md:justify-center' : ''
                      } ${
                        active ? cal.segmentedActive : cal.segmentedInactive
                      }`}
                    >
                      {m.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <p className={`text-sm leading-relaxed ${cal.textMuted} md:hidden`}>
            Switch between a full month calendar and the readable day / agenda list.
          </p>
        </div>
      </div>
    </header>
  )
}
