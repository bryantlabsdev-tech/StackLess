import { format, parseISO } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import { useAppData } from '../../hooks/useAppData'
import { buildNewJob } from '../../lib/jobDefaults'
import { formatDisplayDate } from '../../lib/format'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { JobStatusBadge } from '../ui/Badge'
import { CrewFacepile } from '../ui/CrewFacepile'
import {
  addAssigneeToJobPatch,
  crewNamesList,
  removeAssigneeFromJobPatch,
} from '../../lib/jobAssignees'
import type { Employee, Job } from '../../types'

function assignableJobStatuses(job: Job): boolean {
  return job.status !== 'completed' && job.status !== 'canceled'
}

function formatJobListDate(iso: string): { weekday: string; monthDay: string } {
  try {
    const d = parseISO(iso)
    return { weekday: format(d, 'EEE'), monthDay: format(d, 'MMM d') }
  } catch {
    return { weekday: '', monthDay: iso }
  }
}

export function AssignJobModal({
  open,
  onClose,
  employee,
}: {
  open: boolean
  onClose: () => void
  employee: Employee
}) {
  const { jobs, customers, employees, updateJob, addJob } = useAppData()
  const [includeAssigned, setIncludeAssigned] = useState(false)
  /** Keeps rows visible after add/remove until Done, so multi-crew unassign doesn’t make the row vanish. */
  const [sessionTouchedJobIds, setSessionTouchedJobIds] = useState<Set<string>>(() => new Set())
  const [query, setQuery] = useState('')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  })
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('11:00')
  const [customerId, setCustomerId] = useState(() => customers[0]?.id ?? '')

  useEffect(() => {
    if (customers.length === 0) return
    if (!customers.some((c) => c.id === customerId)) {
      setCustomerId(customers[0]!.id)
    }
  }, [customers, customerId])

  useEffect(() => {
    if (open) setSessionTouchedJobIds(new Set())
  }, [open, employee.id])

  const pool = useMemo(() => {
    return jobs.filter((j) => assignableJobStatuses(j))
  }, [jobs])

  const filteredExisting = useMemo(() => {
    const q = query.trim().toLowerCase()
    return pool.filter((j) => {
      const onThisCrew = j.assignees.includes(employee.id)
      const pinnedInSession = sessionTouchedJobIds.has(j.id)
      // Without "include assigned": unassigned, this employee’s jobs, or jobs you’ve changed this session (stay visible).
      if (!includeAssigned && j.assignees.length > 0 && !onThisCrew && !pinnedInSession) return false
      if (!q) return true
      const hay = `${j.title} ${j.customer_name} ${j.date} ${j.service_type}`.toLowerCase()
      return hay.includes(q)
    })
  }, [pool, includeAssigned, query, employee.id, sessionTouchedJobIds])

  const sortedExisting = useMemo(() => {
    return [...filteredExisting].sort((a, b) => {
      const aUn = a.assignees.length === 0
      const bUn = b.assignees.length === 0
      const aOn = a.assignees.includes(employee.id)
      const bOn = b.assignees.includes(employee.id)
      if (aUn !== bUn) return aUn ? -1 : 1
      if (aOn !== bOn) return aOn ? -1 : 1
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return a.start_time.localeCompare(b.start_time)
    })
  }, [filteredExisting, employee.id])

  const pinJobForSession = (jobId: string) => {
    setSessionTouchedJobIds((prev) => new Set(prev).add(jobId))
  }

  const handleAddToCrew = (job: Job) => {
    updateJob(job.id, addAssigneeToJobPatch(job, employee.id))
    pinJobForSession(job.id)
  }

  const handleRemoveFromCrew = (job: Job) => {
    if (!job.assignees.includes(employee.id)) return
    updateJob(job.id, removeAssigneeFromJobPatch(job, employee.id))
    pinJobForSession(job.id)
  }

  const handleQuickCreate = () => {
    const t = title.trim()
    if (!t || customers.length === 0) return
    const c = customers.find((x) => x.id === customerId)
    if (!c) return
    const base = buildNewJob(customers, date)
    addJob({
      ...base,
      title: t,
      customer_id: c.id,
      customer_name: c.full_name,
      address: c.address ?? '',
      date,
      start_time: startTime,
      end_time: endTime,
      assignees: [employee.id],
      status: 'scheduled',
    })
    onClose()
  }

  return (
    <Modal
      open={open}
      title={`Crew for ${employee.full_name}`}
      description="Add or remove this person on existing jobs — other crew members are unchanged. Use Done when finished."
      onClose={onClose}
      wide
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="space-y-7">
        <section aria-labelledby="assign-existing-heading" className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h3
              id="assign-existing-heading"
              className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-gray-400"
            >
              Existing jobs
            </h3>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-0.5 text-sm text-slate-700 transition-colors hover:bg-slate-100/80 dark:text-gray-300 dark:hover:bg-slate-800/80">
              <input
                type="checkbox"
                checked={includeAssigned}
                onChange={(e) => setIncludeAssigned(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-600"
              />
              Include assigned jobs
            </label>
          </div>
          <p className="text-xs leading-relaxed text-slate-500 dark:text-gray-500">
            Jobs with no crew appear first (amber). Jobs you’re already on stay listed so you can remove yourself. Turn on “Include assigned jobs” to see all active jobs with a crew.
          </p>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, customer, date…"
            className="mt-1"
            aria-label="Filter jobs"
          />

          <div className="mt-1 max-h-[min(52vh,22rem)] overflow-y-auto overscroll-y-contain scroll-smooth rounded-xl border border-slate-200/90 bg-slate-50/70 p-2 shadow-inner shadow-slate-900/[0.03] dark:border-slate-700 dark:bg-slate-950/50 dark:shadow-black/20">
            {sortedExisting.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm leading-relaxed text-slate-500 dark:text-gray-400">
                No matching jobs. Try another search or create below.
              </p>
            ) : (
              <ul className="flex flex-col gap-2.5" role="list">
                {sortedExisting.map((j) => {
                  const unassigned = j.assignees.length === 0
                  const onCrew = j.assignees.includes(employee.id)
                  const nameList = crewNamesList(j.assignees, employees)
                  const { weekday, monthDay } = formatJobListDate(j.date)
                  const fullDateLabel = formatDisplayDate(j.date)
                  const stripClass = onCrew
                    ? 'bg-emerald-500'
                    : unassigned
                      ? 'bg-amber-400'
                      : 'bg-slate-300 dark:bg-slate-600'
                  return (
                    <li
                      key={j.id}
                      title={`${j.title} — ${fullDateLabel}${nameList.length ? ` — ${nameList.join(', ')}` : ''}`}
                      className={[
                        'relative grid grid-cols-1 gap-3 overflow-hidden rounded-xl border pl-3 pr-3 py-3 transition-shadow duration-150 sm:grid-cols-[minmax(0,4.25rem)_minmax(0,1fr)_auto] sm:gap-4 sm:py-3.5 sm:pl-4 sm:pr-3',
                        onCrew
                          ? 'border-emerald-300/90 bg-gradient-to-r from-emerald-50/95 to-white shadow-sm ring-1 ring-emerald-400/25 dark:border-emerald-800/55 dark:from-emerald-950/40 dark:to-slate-900 dark:ring-emerald-500/20'
                          : unassigned
                            ? 'border-amber-200/90 bg-gradient-to-r from-amber-50/95 to-white shadow-sm ring-1 ring-amber-400/25 dark:border-amber-700/50 dark:from-amber-950/50 dark:to-slate-900 dark:ring-amber-500/20'
                            : 'border-slate-200/80 bg-white/90 dark:border-slate-700/80 dark:bg-slate-900/80',
                      ].join(' ')}
                    >
                      <span
                        className={`absolute left-0 top-0 h-full w-1 rounded-l-xl ${stripClass}`}
                        aria-hidden
                      />
                      <time
                        className="flex shrink-0 flex-row items-baseline gap-2 border-b border-slate-100 pb-2 pl-0.5 sm:flex-col sm:items-start sm:gap-0 sm:border-0 sm:pb-0 dark:border-slate-700/80"
                        dateTime={j.date}
                      >
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                          {weekday}
                        </span>
                        <span className="text-sm font-semibold tabular-nums text-slate-800 dark:text-gray-100">
                          {monthDay}
                        </span>
                      </time>

                      <div className="min-w-0 pl-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="min-w-0 flex-1 truncate font-semibold leading-snug text-slate-900 dark:text-white">
                            {j.title}
                          </p>
                          {onCrew ? (
                            <span className="shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm dark:bg-emerald-600">
                              On your crew
                            </span>
                          ) : unassigned ? (
                            <span className="shrink-0 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950 shadow-sm dark:bg-amber-500/70 dark:text-amber-950">
                              Needs crew
                            </span>
                          ) : (
                            <span className="shrink-0 rounded-full bg-slate-200/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-700 shadow-sm dark:bg-slate-700 dark:text-slate-100">
                              Other crew
                            </span>
                          )}
                        </div>
                        {j.customer_name ? (
                          <p className="mt-0.5 truncate text-sm text-slate-600 dark:text-gray-400">{j.customer_name}</p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium tabular-nums text-slate-700 dark:text-gray-300">
                            {j.start_time}–{j.end_time}
                          </span>
                          <JobStatusBadge status={j.status} />
                        </div>

                        {!unassigned ? (
                          <div className="mt-3 rounded-lg border border-slate-200/90 bg-white/80 px-2.5 py-2 dark:border-slate-600/80 dark:bg-slate-800/50">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                              Crew
                            </p>
                            <div className="mt-1.5 flex flex-wrap items-start gap-2">
                              <CrewFacepile
                                assigneeIds={j.assignees}
                                employees={employees}
                                size="xs"
                                highlightEmployeeId={onCrew ? employee.id : null}
                                className="shrink-0 pt-0.5"
                              />
                              <ul className="flex min-w-0 flex-1 flex-wrap gap-1.5" aria-label="Crew members">
                                {j.assignees.map((id) => {
                                  const name =
                                    employees.find((e) => e.id === id)?.full_name?.trim() || 'Unknown'
                                  const isYou = id === employee.id
                                  return (
                                    <li key={id}>
                                      <span
                                        className={[
                                          'inline-flex max-w-[11rem] truncate rounded-md px-2 py-0.5 text-[11px] font-medium leading-tight',
                                          isYou && onCrew
                                            ? 'bg-emerald-100 text-emerald-950 ring-1 ring-emerald-400/50 dark:bg-emerald-950/55 dark:text-emerald-50 dark:ring-emerald-600/50'
                                            : 'bg-slate-100 text-slate-800 ring-1 ring-slate-200/90 dark:bg-slate-800/90 dark:text-slate-100 dark:ring-slate-600/80',
                                        ].join(' ')}
                                      >
                                        {name}
                                        {isYou && onCrew ? (
                                          <span className="ml-1 text-[10px] font-semibold text-emerald-800 dark:text-emerald-200">
                                            (you)
                                          </span>
                                        ) : null}
                                      </span>
                                    </li>
                                  )
                                })}
                              </ul>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex w-full flex-col justify-center gap-2 sm:w-[8.75rem] sm:shrink-0 sm:self-stretch sm:pl-1">
                        {onCrew ? (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => handleRemoveFromCrew(j)}
                            aria-label={`Remove ${employee.full_name} from ${j.title}`}
                            className="w-full justify-center border-rose-200/90 bg-white px-3 py-2 text-sm font-semibold text-rose-700 shadow-sm transition-[transform,box-shadow,filter] duration-150 ease-out hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800 active:scale-[0.98] dark:border-rose-900/55 dark:bg-slate-900 dark:text-rose-300 dark:hover:border-rose-700 dark:hover:bg-rose-950/45 dark:hover:text-rose-200"
                          >
                            Remove from crew
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            onClick={() => handleAddToCrew(j)}
                            aria-label={`Add ${employee.full_name} to ${j.title}`}
                            className="w-full justify-center px-3 py-2 text-sm font-semibold shadow-sm transition-[transform,box-shadow,filter] duration-150 ease-out hover:brightness-[1.03] active:scale-[0.98] active:brightness-[0.98]"
                          >
                            Add to crew
                          </Button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>

        <div className="border-t border-slate-200/90 dark:border-slate-800" />

        <section aria-labelledby="assign-quick-heading" className="space-y-3">
          <h3
            id="assign-quick-heading"
            className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-gray-400"
          >
            Quick create job
          </h3>
          <p className="text-xs leading-relaxed text-slate-500 dark:text-gray-500">
            Uses one customer account for the address; edit full details later in Jobs.
          </p>
          <div className="mt-1 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-gray-300">
                Customer
              </label>
              {customers.length === 0 ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
                  Add a customer first (Customers page).
                </p>
              ) : (
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-base text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:border-emerald-500/60 sm:text-sm"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <Input label="Job title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Input
              label="Start time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <Input label="End time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
          <div className="mt-2">
            <Button
              type="button"
              className="w-full touch-manipulation transition-[transform,filter] duration-150 ease-out active:scale-[0.99] sm:w-auto sm:px-6 sm:py-2.5"
              disabled={!title.trim() || !customerId || customers.length === 0}
              onClick={handleQuickCreate}
            >
              Create & assign
            </Button>
          </div>
        </section>
      </div>
    </Modal>
  )
}
