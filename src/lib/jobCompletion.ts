import type { JobChecklistItem, JobTask, TaskPhoto } from '../types'

export function canMarkJobComplete(
  checklist: JobChecklistItem[],
  tasks: JobTask[],
  photos: TaskPhoto[] = [],
  options: { requiresPhotos?: boolean } = {},
): { ok: boolean; reason?: string } {
  if (checklist.length === 0) {
    return {
      ok: false,
      reason: 'This job needs at least one checklist item before it can be completed.',
    }
  }
  if (!checklist.every((c) => c.is_completed)) {
    return {
      ok: false,
      reason: 'Check every box in the wrap-up checklist at the bottom of this screen.',
    }
  }
  if (tasks.length > 0 && !tasks.every((t) => t.is_completed)) {
    return { ok: false, reason: 'Mark every task complete — expand each one and use the checkbox.' }
  }
  if (options.requiresPhotos) {
    const taskIds = new Set(tasks.map((t) => t.id))
    const jobPhotos = photos.filter((photo) => taskIds.has(photo.task_id))
    const hasBefore = jobPhotos.some((photo) => photo.label === 'before')
    const hasAfter = jobPhotos.some((photo) => photo.label === 'after')
    if (!hasBefore || !hasAfter) {
      return {
        ok: false,
        reason: 'Upload at least one Before work photo and one After work photo before completing this job.',
      }
    }
  }
  return { ok: true }
}
