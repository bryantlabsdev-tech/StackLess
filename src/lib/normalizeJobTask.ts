import type { JobTask } from '../types/jobExecution'

/**
 * Normalizes persisted tasks for the job execution model.
 * Legacy rows used `status: 'pending' | 'in_progress' | 'done'`; we now use `is_completed`.
 */
export function normalizeJobTask(raw: unknown): JobTask {
  const t = raw as Record<string, unknown>
  const id = String(t.id ?? '')
  const job_id = String(t.job_id ?? '')
  const title = String(t.title ?? 'Task')
  const description = typeof t.description === 'string' ? t.description : ''

  if (typeof t.is_completed === 'boolean') {
    return { id, job_id, title, description, is_completed: t.is_completed }
  }

  const st = t.status
  const is_completed = st === 'done'
  return { id, job_id, title, description, is_completed }
}
