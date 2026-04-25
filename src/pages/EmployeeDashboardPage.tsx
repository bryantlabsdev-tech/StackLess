import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAppData } from '../hooks/useAppData'
import { useAuth } from '../hooks/useAuth'
import { IconCalendar, IconClipboard, IconDashboard } from '../components/icons'
import { PageContainer } from '../components/layout/PageContainer'
import { PageHeader } from '../components/ui/PageHeader'
import { StatCard } from '../components/ui/StatCard'
import { formatISODate } from '../lib/format'

const secondaryBtn =
  'inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700'

export function EmployeeDashboardPage() {
  const { user } = useAuth()
  const { jobs } = useAppData()
  const employeeId = user?.role === 'employee' ? user.employee_id : null

  const mine = useMemo(
    () => (employeeId ? jobs.filter((j) => j.assignees.includes(employeeId)) : []),
    [jobs, employeeId],
  )

  const today = formatISODate(new Date())
  const stats = useMemo(() => {
    const todayJobs = mine.filter((j) => j.date === today)
    const upcoming = mine.filter((j) => j.date >= today && j.status !== 'canceled')
    const active = mine.filter((j) => j.status === 'in_progress' || j.status === 'scheduled')
    return {
      todayCount: todayJobs.length,
      upcomingCount: upcoming.length,
      activeCount: active.length,
    }
  }, [mine, today])

  return (
    <PageContainer>
      <PageHeader
        title={`Hello, ${user?.full_name?.split(' ')[0] ?? 'there'}`}
        description="Your assignments at a glance — open My jobs for the full list or My schedule for the calendar."
        action={
          <div className="flex flex-wrap gap-2">
            <Link to="/my-schedule" className={secondaryBtn}>
              My schedule
            </Link>
            <Link
              to="/my-jobs"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
            >
              My jobs
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Today"
          value={stats.todayCount}
          hint="Jobs on today’s date."
          to="/my-schedule"
          accent="emerald"
          icon={<IconCalendar />}
        />
        <StatCard
          label="Upcoming"
          value={stats.upcomingCount}
          hint="From today forward (not canceled)."
          to="/my-jobs"
          accent="sky"
          icon={<IconClipboard />}
        />
        <StatCard
          label="Active"
          value={stats.activeCount}
          hint="Scheduled or in progress."
          to="/my-jobs"
          accent="violet"
          icon={<IconDashboard />}
        />
      </div>
    </PageContainer>
  )
}
