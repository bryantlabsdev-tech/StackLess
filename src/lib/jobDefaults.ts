import { defaultChecklistForJob } from '../types/jobExecution'
import { formatISODate } from './format'
import type { Customer, Job } from '../types'

export function defaultTaskIdForJob(jobId: string) {
  return `${jobId}-complete-visit`
}

export function buildNewJob(
  customers: Customer[],
  dateISO?: string,
): Omit<Job, 'id'> {
  const d = dateISO ?? formatISODate(new Date())
  const first = customers[0]
  return {
    title: '',
    customer_id: first?.id ?? '',
    customer_name: first?.full_name ?? '',
    service_type: '',
    address: first?.address ?? '',
    job_value: null,
    date: d,
    start_time: '09:00',
    end_time: '11:00',
    assignees: [],
    status: 'unassigned',
    notes: '',
    requires_photos: true,
    checklist: defaultChecklistForJob(''),
    work_started_at: null,
    work_completed_at: null,
    verification_feedback: '',
  }
}
