import { Link, Navigate, useParams } from 'react-router-dom'
import { JobDetailsScreen } from '../components/job-details/JobDetailsScreen'
import { PageContainer } from '../components/layout/PageContainer'
import { useAppData } from '../hooks/useAppData'
import { useAuth } from '../hooks/useAuth'

export function EmployeeJobExecutionPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const { user } = useAuth()
  const { getJob } = useAppData()
  const job = jobId ? getJob(jobId) : undefined

  if (!jobId) {
    return <Navigate to="/my-jobs" replace />
  }

  if (!job) {
    return <Navigate to="/my-jobs" replace />
  }

  if (user?.role !== 'employee' || !user.employee_id || !job.assignees.includes(user.employee_id)) {
    return <Navigate to="/my-jobs" replace />
  }

  return (
    <PageContainer>
      <div className="mb-3">
        <Link
          to="/my-jobs"
          className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
        >
          ← My jobs
        </Link>
      </div>

      <JobDetailsScreen job={job} variant="field" showAddTask={false} />
    </PageContainer>
  )
}
