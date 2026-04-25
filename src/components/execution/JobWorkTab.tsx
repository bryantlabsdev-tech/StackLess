import type { Job } from '../../types'
import { JobDetailsScreen } from '../job-details/JobDetailsScreen'

/** Admin “Work” tab — same execution layout as the crew job details screen. */
export function JobWorkTab({
  job,
  variant,
  showAddTask,
}: {
  job: Job
  variant: 'admin' | 'field'
  showAddTask: boolean
}) {
  return (
    <JobDetailsScreen
      job={job}
      variant={variant}
      showAddTask={showAddTask}
      showJobHeader={variant === 'field'}
    />
  )
}
