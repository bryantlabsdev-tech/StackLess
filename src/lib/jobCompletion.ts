import type { JobChecklistItem, JobTask } from '../types'

export function canMarkJobComplete(
  checklist: JobChecklistItem[],
  tasks: JobTask[],
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
  return { ok: true }
}
