import type { TaskPhoto } from '../types'
import type { Profile } from '../types/profile'

function storageOwnerId(photo: TaskPhoto) {
  return photo.storage_path?.split('/')[0] ?? null
}

export function isTaskPhotoOwner(photo: TaskPhoto, user: Profile | null) {
  if (!user) return false
  if (photo.uploaded_by_id) return photo.uploaded_by_id === user.id

  const ownerId = storageOwnerId(photo)
  if (ownerId) return ownerId === user.id

  return photo.uploaded_by.trim() !== '' && photo.uploaded_by === user.full_name
}

export function canViewTaskPhoto(photo: TaskPhoto, user: Profile | null) {
  void photo
  if (!user) return false
  return user.role === 'admin' || user.role === 'employee'
}

export function canManageTaskPhoto(photo: TaskPhoto, user: Profile | null) {
  if (!user) return false
  if (user.role === 'admin') return true
  return isTaskPhotoOwner(photo, user)
}
