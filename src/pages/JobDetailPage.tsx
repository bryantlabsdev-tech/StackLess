import { useMemo, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { JobWorkTab } from '../components/execution/JobWorkTab'
import { JobModal } from '../components/jobs/JobModal'
import { PageContainer } from '../components/layout/PageContainer'
import { JobStatusBadge } from '../components/ui/Badge'
import { CrewAssignmentInline } from '../components/ui/CrewFacepile'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { useAppData } from '../hooks/useAppData'
import { formatDisplayDate } from '../lib/format'

const secondaryLinkClass =
  'inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700 sm:flex-none'

type TabId = 'overview' | 'work'

export function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const { getJob, employees } = useAppData()
  const job = jobId ? getJob(jobId) : undefined

  const [editOpen, setEditOpen] = useState(false)

  /** Execution (tasks, photos, checklist, time) is the default — management summary is opt-in. */
  const tab: TabId = searchParams.get('tab') === 'overview' ? 'overview' : 'work'

  const setTabAndUrl = (id: TabId) => {
    if (id === 'overview') {
      setSearchParams({ tab: 'overview' }, { replace: true })
    } else {
      setSearchParams({}, { replace: true })
    }
  }

  const title = useMemo(() => job?.title ?? 'Job', [job])

  if (!jobId) {
    return <Navigate to="/jobs" replace />
  }

  if (!job) {
    return <Navigate to="/jobs" replace />
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <Link
          to="/jobs"
          className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          ← Back to jobs
        </Link>
      </div>

      <PageHeader
        title={title}
        description={`${job.customer_name} · ${formatDisplayDate(job.date)} · ${job.start_time}–${job.end_time}`}
        action={
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <Link to="/calendar" className={secondaryLinkClass}>
              View calendar
            </Link>
            <Button type="button" className="flex-1 sm:flex-none" onClick={() => setEditOpen(true)}>
              Edit job
            </Button>
          </div>
        }
      />

      <div className="mt-6 border-b border-slate-200 dark:border-slate-800">
        <nav className="flex gap-1" aria-label="Job sections">
          {(
            [
              { id: 'work' as const, label: 'Work' },
              { id: 'overview' as const, label: 'Details' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTabAndUrl(t.id)}
              className={`relative -mb-px min-h-11 flex-1 border-b-2 px-4 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 sm:flex-none ${
                tab === t.id
                  ? 'border-emerald-600 text-emerald-900 dark:border-emerald-500 dark:text-emerald-300'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-gray-500 dark:hover:text-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6 sm:mt-8">
        {tab === 'overview' ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm shadow-slate-900/[0.03] dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20 sm:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">
              Job summary
            </h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-gray-400">Customer</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{job.customer_name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-gray-400">Service</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{job.service_type}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-slate-500 dark:text-gray-400">Address</dt>
                <dd className="mt-1 text-sm text-slate-800 dark:text-gray-300">{job.address}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-gray-400">Crew</dt>
                <dd className="mt-1">
                  <CrewAssignmentInline assigneeIds={job.assignees} employees={employees} />
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-gray-400">Status</dt>
                <dd className="mt-1">
                  <JobStatusBadge status={job.status} />
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-slate-500 dark:text-gray-400">Notes</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-gray-300">
                  {job.notes?.trim() ? job.notes : '—'}
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <JobWorkTab job={job} variant="admin" showAddTask />
        )}
      </div>

      <JobModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        jobId={job.id}
      />
    </PageContainer>
  )
}
