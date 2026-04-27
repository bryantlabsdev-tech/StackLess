import { migrateAssigneeIdsFromUnknown, stripLegacyAssignFields } from './jobAssignees'
import { normalizeJobValue } from './jobValue'
import { defaultChecklistForJob } from '../types/jobExecution'
import type { JobChecklistItem } from '../types/jobExecution'
import type { Job } from '../types'

function newId(): string {
  return crypto.randomUUID()
}

/** Migrate legacy rows (`label` / `done`) and normalize ordering. */
function normalizeChecklistRow(
  raw: unknown,
  jobId: string,
  fallbackIndex: number,
): JobChecklistItem {
  const o = raw as Record<string, unknown>
  const id = typeof o.id === 'string' && o.id ? o.id : newId()
  const title =
    typeof o.title === 'string'
      ? o.title.trim()
      : typeof o.label === 'string'
        ? o.label.trim()
        : ''
  const is_completed =
    typeof o.is_completed === 'boolean'
      ? o.is_completed
      : typeof o.done === 'boolean'
        ? o.done
        : false
  const job_id =
    typeof o.job_id === 'string' && o.job_id.length > 0 ? o.job_id : jobId
  const order_index =
    typeof o.order_index === 'number' && Number.isFinite(o.order_index)
      ? o.order_index
      : fallbackIndex

  return {
    id,
    job_id,
    title: title || 'Checklist item',
    is_completed,
    order_index,
  }
}

function normalizeChecklist(job: Job): JobChecklistItem[] {
  const raw = job.checklist ?? []
  if (raw.length === 0) {
    return defaultChecklistForJob(job.id)
  }

  const mapped = raw.map((c, i) => normalizeChecklistRow(c, job.id, i))
  const sorted = [...mapped].sort((a, b) => a.order_index - b.order_index)
  return sorted.map((c, i) => ({ ...c, job_id: job.id, order_index: i }))
}

/** Merge persisted jobs with execution fields added in newer app versions. */
export function ensureJobExecutionFields(job: Job): Job {
  const assignees = migrateAssigneeIdsFromUnknown(job)
  const base = stripLegacyAssignFields({ ...(job as unknown as Record<string, unknown>), assignees }) as Job
  const withAssignees: Job = { ...base, assignees }
  return {
    ...withAssignees,
    requires_photos:
      typeof (job as unknown as { requires_photos?: unknown }).requires_photos === 'boolean'
        ? (job as unknown as { requires_photos: boolean }).requires_photos
        : true,
    job_value: normalizeJobValue(
      (job as unknown as { job_value?: unknown; value?: unknown; price?: unknown; amount?: unknown }).job_value ??
        (job as unknown as { value?: unknown }).value ??
        (job as unknown as { price?: unknown }).price ??
        (job as unknown as { amount?: unknown }).amount,
    ),
    checklist: normalizeChecklist(withAssignees),
    work_started_at: job.work_started_at ?? null,
    work_completed_at: job.work_completed_at ?? null,
    verification_feedback:
      typeof (job as unknown as { verification_feedback?: unknown }).verification_feedback === 'string'
        ? (job as unknown as { verification_feedback: string }).verification_feedback
        : '',
  }
}
