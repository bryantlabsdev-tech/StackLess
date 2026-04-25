export type JobStatus =
  | 'unassigned'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'canceled'

export interface Customer {
  id: string
  full_name: string
  phone: string
  email: string
  address: string
  notes: string
}

export interface Job {
  id: string
  title: string
  customer_id: string
  customer_name: string
  service_type: string
  address: string
  /** ISO date YYYY-MM-DD */
  date: string
  start_time: string
  end_time: string
  /** Employee IDs on this job’s crew (no duplicates). */
  assignees: string[]
  status: JobStatus
  notes: string
  /** Closing checklist — all must be checked before job can be marked complete. */
  checklist: import('./jobExecution').JobChecklistItem[]
  /** Field clock-in — maps to “start time” for work performed (ISO 8601). */
  work_started_at: string | null
  /** Field clock-out — maps to “end time” for work performed (ISO 8601). */
  work_completed_at: string | null
}

export type { JobChecklistItem, JobTask, TaskPhoto } from './jobExecution'
export type { PhotoLabelId } from '../lib/taskPhotoLabels'
export { PHOTO_LABEL_IDS, PHOTO_LABEL_COPY, photoLabelBadgeClass } from '../lib/taskPhotoLabels'
export {
  DEFAULT_CHECKLIST_TEMPLATE,
  defaultChecklistForJob,
} from './jobExecution'

export type EmployeeAccountStatus = 'active' | 'inactive'

export interface Employee {
  id: string
  full_name: string
  phone: string
  role: string
  availability: string
  status: EmployeeAccountStatus
  notes: string
}

export type { Profile, ProfileStatus, UserRole } from './profile'
export type { EmployeeDaySchedule, EmployeeDayScheduleStatus } from './employeeSchedule'

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  unassigned: 'Unassigned',
  scheduled: 'Scheduled',
  in_progress: 'In progress',
  completed: 'Completed',
  canceled: 'Canceled',
}

