import { startOfMonth } from 'date-fns'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppData } from '../hooks/useAppData'
import { useAuth } from '../hooks/useAuth'
import { MonthCalendar } from '../components/schedule/MonthCalendar'
import { PageContainer } from '../components/layout/PageContainer'
import { PageHeader } from '../components/ui/PageHeader'

const secondaryLinkClass =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700'

export function MySchedulePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { jobs, employeeDaySchedules } = useAppData()
  const employeeId = user?.role === 'employee' ? user.employee_id : null

  const [view, setView] = useState(() => startOfMonth(new Date()))

  const mine = useMemo(() => {
    if (!employeeId) return []
    return jobs.filter((j) => j.assignees.includes(employeeId))
  }, [jobs, employeeId])

  const myDaySchedules = useMemo(() => {
    if (!employeeId) return undefined
    return employeeDaySchedules.filter((r) => r.employee_id === employeeId)
  }, [employeeId, employeeDaySchedules])

  return (
    <PageContainer>
      <PageHeader
        title="My schedule"
        description="Your workdays, time off, and assigned jobs — tap a job to open details. Amber highlights mean a job conflicts with time off."
        action={
          <Link to="/my-jobs" className={secondaryLinkClass}>
            My jobs
          </Link>
        }
      />

      <MonthCalendar
        jobs={mine}
        view={view}
        onViewChange={setView}
        onJobClick={(id) => navigate(`/my-jobs/${id}`)}
        showUnassignedLegend={false}
        daySchedules={myDaySchedules}
      />

    </PageContainer>
  )
}
