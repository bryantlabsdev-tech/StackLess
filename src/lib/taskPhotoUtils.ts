import type { TaskPhoto } from '../types'
import { isPhotoLabelId } from './taskPhotoLabels'

export function normalizeTaskPhoto(raw: unknown): TaskPhoto {
  const p = raw as Record<string, unknown>
  const labelRaw = p.label
  const label = isPhotoLabelId(labelRaw) ? labelRaw : 'reference'
  return {
    id: String(p.id ?? ''),
    task_id: String(p.task_id ?? ''),
    image_url: String(p.image_url ?? ''),
    storage_path: typeof p.storage_path === 'string' ? p.storage_path : null,
    label,
    note: typeof p.note === 'string' ? p.note : '',
    uploaded_by_id: typeof p.uploaded_by_id === 'string' ? p.uploaded_by_id : null,
    uploaded_by: typeof p.uploaded_by === 'string' ? p.uploaded_by : '',
    created_at: typeof p.created_at === 'string' ? p.created_at : new Date().toISOString(),
    updated_at:
      p.updated_at === null || p.updated_at === undefined
        ? null
        : typeof p.updated_at === 'string'
          ? p.updated_at
          : null,
  }
}

export function sortTaskPhotosNewestFirst(photos: TaskPhoto[]): TaskPhoto[] {
  return [...photos].sort((a, b) => b.created_at.localeCompare(a.created_at))
}

/** Max size for local data URLs — align with Supabase upload limits later. */
export const MAX_TASK_PHOTO_BYTES = 2 * 1024 * 1024
