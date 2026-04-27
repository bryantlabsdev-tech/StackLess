export type JobStatus =
  | 'unassigned'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'needs_verification'
  | 'verified'
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
  /** Optional estimated or actual job value in dollars. */
  job_value: number | null
  /** ISO date YYYY-MM-DD */
  date: string
  start_time: string
  end_time: string
  /** Employee IDs on this job’s crew (no duplicates). */
  assignees: string[]
  status: JobStatus
  notes: string
  /** Require before/after proof photos before work can be submitted complete. */
  requires_photos: boolean
  /** Closing checklist — all must be checked before job can be marked complete. */
  checklist: import('./jobExecution').JobChecklistItem[]
  /** Field clock-in — maps to “start time” for work performed (ISO 8601). */
  work_started_at: string | null
  /** Field clock-out — maps to “end time” for work performed (ISO 8601). */
  work_completed_at: string | null
  /** Admin feedback when a submitted job is sent back for crew rework. */
  verification_feedback: string
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
  email: string
  role: string
  availability: string
  status: EmployeeAccountStatus
  notes: string
}

export type { Profile, ProfileStatus, UserRole } from './profile'
export type { EmployeeDaySchedule, EmployeeDayScheduleStatus } from './employeeSchedule'
export type { EmployeeInvite, EmployeeInviteStatus } from './employeeInvite'

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  unassigned: 'New',
  scheduled: 'Assigned',
  in_progress: 'In progress',
  completed: 'Completed',
  needs_verification: 'Needs verification',
  verified: 'Verified',
  canceled: 'Canceled',
}

