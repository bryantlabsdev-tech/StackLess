import type { TaskPhoto } from '../types'

/** Bust browser cache and force <img> remount when the saved image or metadata revision changes. */
export function taskPhotoRevisionKey(p: Pick<TaskPhoto, 'id' | 'updated_at' | 'created_at'>): string {
  return `${p.id}:${p.updated_at ?? p.created_at}`
}
