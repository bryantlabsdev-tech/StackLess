/** Field execution — tasks, checklist, and clock times (separate from scheduled window). */

import type { PhotoLabelId } from '../lib/taskPhotoLabels'

/** Closing checklist row — dynamic per job; all must be completed before job completion. */
export interface JobChecklistItem {
  id: string
  job_id: string
  title: string
  is_completed: boolean
  order_index: number
}

export interface JobTask {
  id: string
  job_id: string
  title: string
  description: string
  /** Whether the crew has finished this step. */
  is_completed: boolean
}

/** Site documentation tied to a task (not the whole job). */
export interface TaskPhoto {
  id: string
  task_id: string
  image_url: string
  /** Private Supabase Storage object path, e.g. user_id/job_id/file_name. */
  storage_path?: string | null
  /** When the shot was taken relative to work — drives filters and badges. */
  label: PhotoLabelId
  note: string
  /** Auth profile id for upload ownership and crew-only photo filtering. */
  uploaded_by_id?: string | null
  uploaded_by: string
  created_at: string
  /** Set when image, label, or note is changed after upload. */
  updated_at: string | null
}

/** Default checklist rows for new jobs (stable ids for migration). */
export const DEFAULT_CHECKLIST_TEMPLATE: { id: string; title: string }[] = [
  { id: 'tools', title: 'Tools picked up / ready' },
  { id: 'clean', title: 'Area cleaned' },
  { id: 'photos', title: 'Photos uploaded' },
]

export function defaultChecklistForJob(jobId: string): JobChecklistItem[] {
  return DEFAULT_CHECKLIST_TEMPLATE.map((row, i) => ({
    id: row.id,
    job_id: jobId,
    title: row.title,
    is_completed: false,
    order_index: i,
  }))
}
