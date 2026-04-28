import { supabase } from './supabase'

export const JOB_PHOTOS_BUCKET = 'job-photos'
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7

function extensionForMime(mime: string) {
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  if (mime === 'image/gif') return 'gif'
  return 'jpg'
}

function safeFileName(name: string, mime: string) {
  const trimmed = name.trim()
  const fallback = `photo.${extensionForMime(mime)}`
  const cleaned = (trimmed || fallback)
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return cleaned || fallback
}

function blobFromDataUrl(dataUrl: string) {
  const [meta, base64] = dataUrl.split(',')
  const mime = meta.match(/^data:(.*?);base64$/)?.[1] ?? 'image/jpeg'
  if (!base64) throw new Error('Could not prepare that photo for upload.')

  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }

  return new Blob([bytes], { type: mime })
}

/** JPEG/PNG data URL from PhotoMarkupEditor → Blob for building a `File` before job save. */
export function blobFromImageDataUrl(dataUrl: string): Blob {
  return blobFromDataUrl(dataUrl)
}

export function isDataUrl(value: string) {
  return value.startsWith('data:')
}

export async function createSignedJobPhotoUrl(storagePath: string) {
  const { data, error } = await supabase.storage
    .from(JOB_PHOTOS_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS)

  if (error) throw error
  if (!data?.signedUrl) throw new Error('Could not create a secure photo URL.')
  return data.signedUrl
}

export async function uploadJobPhotoBlob({
  blob,
  fileName,
  jobId,
  storagePath,
  userId,
}: {
  blob: Blob
  fileName?: string | null
  jobId: string
  storagePath?: string | null
  userId: string
}) {
  const objectPath =
    storagePath ??
    `${userId}/${jobId}/${Date.now()}-${crypto.randomUUID()}-${safeFileName(fileName ?? '', blob.type)}`

  const { error } = await supabase.storage
    .from(JOB_PHOTOS_BUCKET)
    .upload(objectPath, blob, {
      contentType: blob.type,
      upsert: true,
    })

  if (error) throw error

  return {
    imageUrl: await createSignedJobPhotoUrl(objectPath),
    storagePath: objectPath,
  }
}

export async function uploadJobPhotoFromDataUrl({
  dataUrl,
  fileName,
  jobId,
  storagePath,
  userId,
}: {
  dataUrl: string
  fileName?: string | null
  jobId: string
  storagePath?: string | null
  userId: string
}) {
  return uploadJobPhotoBlob({
    blob: blobFromDataUrl(dataUrl),
    fileName,
    jobId,
    storagePath,
    userId,
  })
}

export async function deleteStoredJobPhoto(storagePath: string) {
  const { error } = await supabase.storage.from(JOB_PHOTOS_BUCKET).remove([storagePath])
  if (error) throw error
}
