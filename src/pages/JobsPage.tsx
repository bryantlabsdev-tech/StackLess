import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAppData } from '../hooks/useAppData'
import { JobModal } from '../components/jobs/JobModal'
import { PageContainer } from '../components/layout/PageContainer'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { Select } from '../components/ui/Select'
import { JobStatusBadge } from '../components/ui/Badge'
import { CrewAssignmentInline } from '../components/ui/CrewFacepile'
import { jobMatchesEmployeeFilter } from '../lib/jobAssignees'
import { formatJobValue, optionalJobValue } from '../lib/jobValue'
import { formatDisplayDate } from '../lib/format'
import type { JobStatus } from '../types'
import { JOB_STATUS_LABELS } from '../types'

const secondaryLinkClass =
  'inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[14px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-px hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 dark:border-[#1F2A36] dark:bg-[#151B23] dark:text-slate-100 dark:hover:bg-[#1A2230] sm:flex-none'

export function JobsPage() {
  const { jobs, employees } = useAppData()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<JobStatus | 'all'>('all')
  const [employeeId, setEmployeeId] = useState<string | 'all'>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  /* Sync filters when opening from Team (Assign job) — URL is the source of truth for this handoff. */
  /* eslint-disable react-hooks/set-state-in-effect -- apply query params once when navigating from Team */
  useEffect(() => {
    const emp = searchParams.get('employee')
    const fromQ = searchParams.get('from')
    const toQ = searchParams.get('to')
    if (emp && employees.some((e) => e.id === emp)) {
      setEmployeeId(emp)
    }
    if (fromQ) setFrom(fromQ)
    if (toQ) setTo(toQ)
  }, [searchParams, employees])
  /* eslint-enable react-hooks/set-state-in-effect */

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [presetDate, setPresetDate] = useState<string | undefined>(undefined)

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (status !== 'all' && j.status !== status) return false
      if (employeeId !== 'all' && !jobMatchesEmployeeFilter(j, employeeId)) {
        return false
      }
      if (from && j.date < from) return false
      if (to && j.date > to) return false
      return true
    })
  }, [jobs, status, employeeId, from, to])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return a.start_time.localeCompare(b.start_time)
    })
  }, [filtered])

  const openNew = () => {
    setEditingId(null)
    setPresetDate(undefined)
    setModalOpen(true)
  }

  const openEdit = (id: string) => {
    setEditingId(id)
    setPresetDate(undefined)
    setModalOpen(true)
  }

  return (
    <PageContainer>
      <PageHeader
        title="Jobs"
        description="Every job, note, task, photo, and crew assignment starts here. Filter the work and jump to the schedule anytime."
        action={
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <Link to="/calendar" className={secondaryLinkClass}>
              View calendar
            </Link>
            <Button type="button" className="flex-1 sm:flex-none" onClick={openNew}>
              Add job
            </Button>
          </div>
        }
      />

      <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm dark:border-[#1F2A36] dark:bg-[#11161D] dark:shadow-black/20 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as JobStatus | 'all')}
          >
            <option value="all">All statuses</option>
            {(Object.keys(JOB_STATUS_LABELS) as JobStatus[]).map((s) => (
              <option key={s} value={s}>
                {JOB_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
          <Select
            label="Crew"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value as typeof employeeId)}
          >
            <option value="all">Everyone</option>
            <option value="unassigned">Unassigned only</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.full_name}
              </option>
            ))}
          </Select>
          <Input
            label="From date"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <Input
            label="To date"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setStatus('all')
              setEmployeeId('all')
              setFrom('')
              setTo('')
            }}
          >
            Clear filters
          </Button>
        </div>
      </div>

      <div>
        {jobs.length === 0 ? (
          <EmptyState
            title="No jobs yet"
            detail="Create your first job to start organizing your business in one place"
            action={<Button onClick={openNew}>+ Create Job</Button>}
          />
        ) : sorted.length === 0 ? (
          <EmptyState title="No jobs match" detail="Adjust filters or clear them to see everything." />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {sorted.map((j) => {
              const value = optionalJobValue(j)
              return (
                <article
                  key={j.id}
                  className="group rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-xl dark:border-[#1F2A36] dark:bg-[#11161D] dark:shadow-black/20 dark:hover:border-blue-500/45 sm:p-5"
                >
                  <div className="flex flex-col items-start gap-3 min-[420px]:flex-row min-[420px]:justify-between">
                    <div className="min-w-0">
                      <Link
                        to={`/jobs/${j.id}`}
                        className="break-words text-base font-semibold leading-snug tracking-[-0.02em] text-slate-950 transition hover:text-blue-600 dark:text-[#F8FAFC] dark:hover:text-blue-300"
                      >
                        {j.title}
                      </Link>
                      <p className="mt-1 break-words text-sm text-slate-500 dark:text-[#94A3B8]">{j.customer_name}</p>
                    </div>
                    <JobStatusBadge status={j.status} />
                  </div>

                  <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Service</p>
                      <p className="mt-1 break-words text-slate-700 dark:text-slate-300">{j.service_type}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">When</p>
                      <p className="mt-1 text-slate-700 dark:text-slate-300">
                        {formatDisplayDate(j.date)} · {j.start_time}–{j.end_time}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Crew</p>
                      <div className="mt-1">
                        <CrewAssignmentInline assigneeIds={j.assignees} employees={employees} dense />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Value</p>
                      <p className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{value == null ? 'Not set' : formatJobValue(value)}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-[#1F2A36] min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                    <p className="min-w-0 break-words text-sm text-slate-500 dark:text-[#94A3B8]">{j.address}</p>
                    <Button variant="ghost" className="w-full !px-3 !py-2 min-[420px]:w-auto" onClick={() => openEdit(j.id)}>
                      Edit
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      <JobModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        jobId={editingId}
        initialDate={presetDate}
      />
    </PageContainer>
  )
}
