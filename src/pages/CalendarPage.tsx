import { parseISO, startOfMonth } from 'date-fns'
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarGrid } from '../components/calendar/CalendarGrid'
import { CalendarHeader, type CalendarViewMode } from '../components/calendar/CalendarHeader'
import { cal } from '../components/calendar/calendarSurfaces'
import { EmployeeFilterList } from '../components/calendar/EmployeeFilterList'
import { FilterBar } from '../components/calendar/FilterBar'
import { JobDetailsDrawer } from '../components/calendar/JobDetailsDrawer'
import { QuickCreateJobModal } from '../components/calendar/QuickCreateJobModal'
import {
  SidebarQuickFilters,
  type SidebarQuickPreset,
} from '../components/calendar/SidebarQuickFilters'
import { UnassignedJobsPanel } from '../components/calendar/UnassignedJobsPanel'
import { Button } from '../components/ui/Button'
import { useAppData } from '../hooks/useAppData'
import {
  type CalendarFilterState,
  filterCalendarJobs,
} from '../lib/calendarFilters'
import { formatISODate } from '../lib/format'
import type { JobStatus } from '../types'

function defaultFilterState(): CalendarFilterState {
  return {
    search: '',
    status: 'all',
    serviceType: '',
    hiddenEmployeeIds: new Set(),
    assignment: 'all',
  }
}

export function CalendarPage() {
  const { jobs, employees, deleteJob, getJob } = useAppData()
  const [searchParams] = useSearchParams()
  const showEmployeeId = searchParams.get('showEmployee')

  const [view, setView] = useState(() => startOfMonth(new Date()))
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month')
  const [filters, setFilters] = useState<CalendarFilterState>(defaultFilterState)
  const [quickPreset, setQuickPreset] = useState<SidebarQuickPreset>('all')
  const deferredSearch = useDeferredValue(filters.search)

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [presetDate, setPresetDate] = useState<string | undefined>(undefined)

  const filteredJobs = useMemo(() => {
    let list = filterCalendarJobs(
      jobs,
      {
        ...filters,
        search: deferredSearch,
      },
      employees,
    )
    if (quickPreset === 'today') {
      const todayIso = formatISODate(new Date())
      list = list.filter((j) => j.date === todayIso)
    }
    return list
  }, [jobs, employees, filters, deferredSearch, quickPreset])

  const serviceTypes = useMemo(() => {
    const s = new Set<string>()
    for (const j of jobs) s.add(j.service_type)
    return [...s].sort((a, b) => a.localeCompare(b))
  }, [jobs])

  const hasActiveFilters = useMemo(() => {
    return (
      quickPreset === 'today' ||
      filters.search.trim() !== '' ||
      filters.status !== 'all' ||
      filters.serviceType !== '' ||
      filters.assignment !== 'all' ||
      filters.hiddenEmployeeIds.size > 0
    )
  }, [filters, quickPreset])

  const applySidebarPreset = useCallback((preset: SidebarQuickPreset) => {
    setQuickPreset(preset)
    if (preset === 'all') {
      setFilters((f) => ({ ...f, assignment: 'all' }))
    } else if (preset === 'unassigned') {
      setFilters((f) => ({ ...f, assignment: 'unassigned' }))
    } else {
      setFilters((f) => ({ ...f, assignment: 'all' }))
      setView(startOfMonth(new Date()))
    }
  }, [])

  const toggleEmployee = useCallback((employeeId: string) => {
    setFilters((prev) => {
      const nextHidden = new Set(prev.hiddenEmployeeIds)
      if (nextHidden.has(employeeId)) nextHidden.delete(employeeId)
      else nextHidden.add(employeeId)
      return { ...prev, hiddenEmployeeIds: nextHidden }
    })
  }, [])

  const clearFilters = useCallback(() => {
    setQuickPreset('all')
    setFilters(defaultFilterState())
  }, [])

  /** Deep link from Team page — show one crew member on the calendar. */
  /* eslint-disable react-hooks/set-state-in-effect -- map URL param to sidebar “hide others” filter */
  useEffect(() => {
    if (!showEmployeeId || employees.length === 0) return
    if (!employees.some((e) => e.id === showEmployeeId)) return
    const hidden = new Set(
      employees.filter((e) => e.id !== showEmployeeId).map((e) => e.id),
    )
    setFilters((f) => ({ ...f, hiddenEmployeeIds: hidden, assignment: 'all' }))
    setQuickPreset('all')
    setView(startOfMonth(new Date()))
  }, [showEmployeeId, employees])
  /* eslint-enable react-hooks/set-state-in-effect */

  const openQuickCreate = useCallback((iso: string) => {
    setView(startOfMonth(parseISO(iso)))
    setEditingId(null)
    setPresetDate(iso)
    setModalOpen(true)
  }, [])

  const openEditModal = useCallback((jobId: string) => {
    setEditingId(jobId)
    setPresetDate(undefined)
    setModalOpen(true)
  }, [])

  const selectedJob = selectedJobId ? getJob(selectedJobId) ?? null : null

  const handleAssignmentFilterChange = useCallback(
    (assignment: CalendarFilterState['assignment']) => {
      setFilters((f) => ({ ...f, assignment }))
      if (assignment === 'unassigned') {
        setQuickPreset('unassigned')
      } else {
        setQuickPreset('all')
      }
    },
    [],
  )

  return (
    <div className="relative mx-auto w-full max-w-[1680px] px-0 pb-6 pt-1 sm:px-5 sm:pt-5 md:pb-12 lg:px-7">
      <div className={cal.pageWash} aria-hidden />

      <div className="relative">
        <CalendarHeader
          view={view}
          onViewChange={setView}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          search={filters.search}
          onSearchChange={(search) => setFilters((f) => ({ ...f, search }))}
        />

        <div className="mt-5 flex flex-col-reverse gap-5 lg:mt-8 lg:flex-row lg:items-start lg:gap-8">
          <aside
            className="scroll-momentum w-full shrink-0 space-y-4 lg:sticky lg:top-5 lg:w-[292px] lg:max-h-[calc(100dvh-5rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-1"
            aria-label="Schedule actions and filters"
          >
            <div className={cal.sidebarCtaWrap}>
              <Button
                type="button"
                className="w-full rounded-xl py-3 text-sm font-semibold shadow-md shadow-emerald-900/10 dark:shadow-emerald-950/40"
                onClick={() => openQuickCreate(presetDate ?? formatISODate(new Date()))}
              >
                New job
              </Button>
            </div>

            <EmployeeFilterList
              employees={employees}
              hiddenEmployeeIds={filters.hiddenEmployeeIds}
              onToggle={toggleEmployee}
            />

            <SidebarQuickFilters active={quickPreset} onChange={applySidebarPreset} />

            <UnassignedJobsPanel
              jobs={filteredJobs}
              onJobClick={(id) => setSelectedJobId(id)}
            />
          </aside>

          <main className={cal.mainColumn} aria-label="Schedule calendar">
            <FilterBar
              status={filters.status}
              onStatusChange={(status: JobStatus | 'all') =>
                setFilters((f) => ({ ...f, status }))
              }
              serviceType={filters.serviceType}
              serviceTypes={serviceTypes}
              onServiceTypeChange={(serviceType) =>
                setFilters((f) => ({ ...f, serviceType }))
              }
              assignment={filters.assignment}
              onAssignmentChange={handleAssignmentFilterChange}
              onClear={clearFilters}
              hasActiveFilters={hasActiveFilters}
            />

            {viewMode === 'month' ? (
              <CalendarGrid
                view={view}
                jobs={filteredJobs}
                onJobClick={(id) => setSelectedJobId(id)}
                onDayAddClick={openQuickCreate}
                highlightedDateIso={modalOpen && editingId === null ? presetDate : undefined}
                mobileViewMode="month"
              />
            ) : (
              <>
                <div className="md:hidden">
                  <CalendarGrid
                    view={view}
                    jobs={filteredJobs}
                    onJobClick={(id) => setSelectedJobId(id)}
                    onDayAddClick={openQuickCreate}
                    highlightedDateIso={modalOpen && editingId === null ? presetDate : undefined}
                    mobileViewMode="agenda"
                  />
                </div>
                <div className="hidden md:block">
                  <div className={cal.roadmapPlaceholder}>
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-md ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700`}
                    >
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path
                          d="M4 7h16M4 12h16M4 17h10"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <p className={`mt-4 text-base font-semibold ${cal.textPrimary}`}>
                      {viewMode === 'week' ? 'Week view' : 'Day view'} is on the roadmap
                    </p>
                    <p className={`mt-2 max-w-md text-sm leading-relaxed ${cal.textBody}`}>
                      Month view is fully interactive. Week and day views will add crew lanes and
                      hour-by-hour planning for dense days.
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      className="mt-6 rounded-xl px-5 font-semibold"
                      onClick={() => setViewMode('month')}
                    >
                      Back to month
                    </Button>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      <JobDetailsDrawer
        job={selectedJob}
        open={Boolean(selectedJobId)}
        onClose={() => setSelectedJobId(null)}
        onEdit={() => {
          if (!selectedJobId) return
          setSelectedJobId(null)
          openEditModal(selectedJobId)
        }}
        onDelete={() => {
          if (!selectedJobId || !selectedJob) return
          if (
            !window.confirm(
              'Delete this job? This cannot be undone from the calendar.',
            )
          ) {
            return
          }
          void deleteJob(selectedJobId)
          setSelectedJobId(null)
        }}
      />

      <QuickCreateJobModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        jobId={editingId}
        initialDate={presetDate}
      />
    </div>
  )
}
