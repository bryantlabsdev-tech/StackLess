import { useMemo, useState } from 'react'
import { isBefore, parseISO, startOfWeek, startOfMonth } from 'date-fns'
import { Link } from 'react-router-dom'
import { useAppData } from '../hooks/useAppData'
import { PageContainer } from '../components/layout/PageContainer'
import { JobModal } from '../components/jobs/JobModal'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { JobStatusBadge } from '../components/ui/Badge'
import { CrewAssignmentInline } from '../components/ui/CrewFacepile'
import { IconCalendar, IconClipboard, IconUsers } from '../components/icons'
import { formatDisplayDate, formatISODate } from '../lib/format'
import type { Job } from '../types'

const primaryLinkClass =
  'inline-flex w-full items-center justify-center gap-2 rounded-[14px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-px hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 dark:border-[#1F2A36] dark:bg-[#151B23] dark:text-slate-100 dark:hover:bg-[#1A2230] sm:w-auto'

function optionalJobValue(job: Job): number | null {
  const row = job as Job & { value?: unknown; price?: unknown; amount?: unknown }
  const raw = row.value ?? row.price ?? row.amount
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : null
}

function money(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function MiniStat({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint: string
}) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-[#1F2A36] dark:bg-[#11161D] dark:shadow-black/20">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-[#94A3B8]">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-[#F8FAFC]">{value}</p>
      <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-[#94A3B8]">{hint}</p>
    </div>
  )
}

function JobRow({
  job,
  employees,
}: {
  job: Job
  employees: ReturnType<typeof useAppData>['employees']
}) {
  const value = optionalJobValue(job)
  return (
    <Link
      to={`/jobs/${job.id}`}
      className="group block w-full rounded-[16px] border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg dark:border-[#1F2A36] dark:bg-[#11161D] dark:hover:border-blue-500/45"
    >
      <div className="flex flex-col items-start gap-3 min-[420px]:flex-row min-[420px]:justify-between">
        <div className="min-w-0">
          <p className="break-words text-base font-semibold leading-snug text-slate-950 dark:text-[#F8FAFC] sm:text-sm">{job.title}</p>
          <p className="mt-1 break-words text-sm text-slate-500 dark:text-[#94A3B8]">{job.customer_name}</p>
        </div>
        <JobStatusBadge status={job.status} />
      </div>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">When</p>
          <p className="mt-1 text-slate-700 dark:text-slate-300">
            {formatDisplayDate(job.date)} · {job.start_time}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Crew</p>
          <div className="mt-1">
            <CrewAssignmentInline assigneeIds={job.assignees} employees={employees} dense />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Value</p>
          <p className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{value == null ? 'Not set' : money(value)}</p>
        </div>
      </div>
    </Link>
  )
}

export function DashboardPage() {
  const { jobs, employees } = useAppData()
  const [jobOpen, setJobOpen] = useState(false)

  const data = useMemo(() => {
    const today = formatISODate(new Date())
    const now = new Date()
    const weekStart = startOfWeek(now)
    const monthStart = startOfMonth(now)
    const activeJobs = jobs.filter((j) => j.status !== 'completed' && j.status !== 'canceled')
    const todayJobs = jobs
      .filter((j) => j.date === today)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
    const upcomingJobs = activeJobs
      .filter((j) => j.date > today)
      .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
      .slice(0, 5)
    const overdueJobs = activeJobs
      .filter((j) => isBefore(parseISO(j.date), parseISO(today)))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5)
    const completed = jobs.filter((j) => j.status === 'completed').length
    const completedJobs = jobs.filter((j) => j.status === 'completed')
    const revenueThisWeek = completedJobs
      .filter((j) => parseISO(j.date) >= weekStart)
      .reduce((sum, j) => sum + (optionalJobValue(j) ?? 0), 0)
    const revenueThisMonth = completedJobs
      .filter((j) => parseISO(j.date) >= monthStart)
      .reduce((sum, j) => sum + (optionalJobValue(j) ?? 0), 0)

    return { todayJobs, upcomingJobs, overdueJobs, completed, revenueThisWeek, revenueThisMonth }
  }, [jobs])
  const hasActivity = jobs.length > 0

  return (
    <PageContainer>
      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-[#1F2A36] dark:bg-[#11161D] dark:shadow-black/20 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">Owner Dashboard</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-slate-950 dark:text-[#F8FAFC] sm:text-4xl">
              Run today’s work from one calm place.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-[#94A3B8]">
              Track jobs, crew assignments, customers, notes, photos, and schedule changes without jumping between tools.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" onClick={() => setJobOpen(true)}>
              + Add Job
            </Button>
            <Link to="/calendar" className={primaryLinkClass}>
              Open Schedule
            </Link>
          </div>
        </div>
      </section>

      {hasActivity ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MiniStat label="Jobs Today" value={data.todayJobs.length} hint="Scheduled for today" />
          <MiniStat label="Completed" value={data.completed} hint="Closed jobs in the system" />
          <MiniStat label="Revenue This Week" value={money(data.revenueThisWeek)} hint="Uses job value when set" />
          <MiniStat label="Revenue This Month" value={money(data.revenueThisMonth)} hint="Uses job value when set" />
        </div>
      ) : (
        <EmptyState
          title="No activity yet"
          detail="Start by creating your first job"
          action={<Button onClick={() => setJobOpen(true)}>+ Create Job</Button>}
        />
      )}

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm dark:border-[#1F2A36] dark:bg-[#11161D] sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-950 dark:text-[#F8FAFC]">Today’s jobs</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-[#94A3B8]">The work that needs your attention now.</p>
            </div>
            <IconCalendar className="text-blue-500" />
          </div>
          {data.todayJobs.length === 0 ? (
            <EmptyState
              title={hasActivity ? 'No jobs scheduled today' : 'No jobs yet'}
              detail={
                hasActivity
                  ? 'Jobs scheduled for today will appear here.'
                  : 'Create your first job to start organizing your business in one place'
              }
              action={<Button onClick={() => setJobOpen(true)}>+ Create Job</Button>}
            />
          ) : (
            <div className="space-y-3">
              {data.todayJobs.map((job) => (
                <JobRow key={job.id} job={job} employees={employees} />
              ))}
            </div>
          )}
        </section>

        <div className="space-y-5">
          <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm dark:border-[#1F2A36] dark:bg-[#11161D] sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-950 dark:text-[#F8FAFC]">Upcoming jobs</h2>
              <IconClipboard className="text-blue-500" />
            </div>
            {data.upcomingJobs.length === 0 ? (
              <p className="rounded-[16px] border border-dashed border-slate-200 p-5 text-sm text-slate-500 dark:border-[#1F2A36] dark:text-[#94A3B8]">
                No upcoming jobs yet.
              </p>
            ) : (
              <div className="space-y-3">
                {data.upcomingJobs.map((job) => (
                  <JobRow key={job.id} job={job} employees={employees} />
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm dark:border-[#1F2A36] dark:bg-[#11161D] sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-950 dark:text-[#F8FAFC]">Overdue jobs</h2>
              <IconUsers className="text-amber-500" />
            </div>
            {data.overdueJobs.length === 0 ? (
              <p className="rounded-[16px] border border-dashed border-slate-200 p-5 text-sm text-slate-500 dark:border-[#1F2A36] dark:text-[#94A3B8]">
                Nothing overdue. You’re clear.
              </p>
            ) : (
              <div className="space-y-3">
                {data.overdueJobs.map((job) => (
                  <JobRow key={job.id} job={job} employees={employees} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <JobModal open={jobOpen} onClose={() => setJobOpen(false)} jobId={null} />
    </PageContainer>
  )
}
