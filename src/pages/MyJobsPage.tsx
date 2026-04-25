import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAppData } from '../hooks/useAppData'
import { useAuth } from '../hooks/useAuth'
import { PageContainer } from '../components/layout/PageContainer'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { JobStatusBadge } from '../components/ui/Badge'
import { formatDisplayDate } from '../lib/format'

const secondaryLinkClass =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700'

export function MyJobsPage() {
  const { user } = useAuth()
  const { jobs } = useAppData()
  const employeeId = user?.role === 'employee' ? user.employee_id : null

  const mine = useMemo(() => {
    if (!employeeId) return []
    return jobs
      .filter((j) => j.assignees.includes(employeeId))
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date)
        return a.start_time.localeCompare(b.start_time)
      })
  }, [jobs, employeeId])

  return (
    <PageContainer>
      <PageHeader
        title="My jobs"
        description="Only work assigned to you. Open a job for step-by-step tasks, photos, and time on site."
        action={
          <Link to="/my-schedule" className={secondaryLinkClass}>
            My schedule
          </Link>
        }
      />

      <div className="space-y-4">
        {mine.length === 0 ? (
          <EmptyState
            title="No assignments yet"
            detail="When dispatch assigns you to jobs, they’ll show up here. Use My schedule to see them on the calendar."
          />
        ) : (
          mine.map((j) => (
            <article
              key={j.id}
              className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:px-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold leading-snug text-gray-900 dark:text-white">{j.title}</h2>
                    <p className="mt-1 text-sm font-medium text-slate-600 dark:text-gray-400">{j.service_type}</p>
                  </div>
                  <JobStatusBadge status={j.status} />
                </div>
                <p className="mt-3 text-[15px] font-semibold tabular-nums text-slate-800 dark:text-gray-200">
                  {formatDisplayDate(j.date)}
                  <span className="mx-2 font-normal text-slate-400 dark:text-slate-500">·</span>
                  <span className="tabular-nums">
                    {j.start_time}–{j.end_time}
                  </span>
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-600 dark:text-gray-400">{j.address}</p>
              </div>
              <div className="p-4 sm:p-5">
                <Link
                  to={`/my-jobs/${j.id}`}
                  className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 text-base font-semibold text-white shadow-md shadow-emerald-900/15 transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-emerald-950/40"
                >
                  Open job
                </Link>
              </div>
            </article>
          ))
        )}
      </div>
    </PageContainer>
  )
}
