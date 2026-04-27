import { useId, useMemo } from 'react'
import { MAX_TASK_PHOTO_BYTES } from '../../lib/taskPhotoUtils'
import { Button } from '../ui/Button'

export type PendingJobPhoto = {
  id: string
  file: File
  previewUrl: string
}

export function CreateJobPhotosSection({
  photos,
  onAddPhotos,
  onRemovePhoto,
}: {
  photos: PendingJobPhoto[]
  onAddPhotos: (photos: PendingJobPhoto[]) => void
  onRemovePhoto: (photoId: string) => void
}) {
  const inputId = useId()
  const totalSize = useMemo(
    () => photos.reduce((sum, p) => sum + p.file.size, 0),
    [photos],
  )

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const next = Array.from(files)
      .filter((file) => file.type.startsWith('image/') && file.size <= MAX_TASK_PHOTO_BYTES)
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      }))

    if (next.length > 0) onAddPhotos(next)
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-[18px] border border-slate-200 bg-slate-50/50 p-4 dark:border-[#1F2A36] dark:bg-[#11161D]">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">Photos</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-[#94A3B8]">
            Add photos now. They upload after the job is saved so the storage path can include the new job id.
          </p>
        </div>
        <label htmlFor={inputId} className="inline-flex min-h-11 w-full shrink-0 cursor-pointer items-center justify-center rounded-[13px] bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-within:ring-2 focus-within:ring-emerald-400 focus-within:ring-offset-2 dark:focus-within:ring-offset-[#11161D] sm:w-auto">
          Upload Photo
          <input
            id={inputId}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </label>
      </div>

      {photos.length > 0 ? (
        <div className="mt-4 space-y-3">
          <p className="text-xs font-medium text-slate-500 dark:text-[#94A3B8]">
            {photos.length} selected · {(totalSize / (1024 * 1024)).toFixed(1)} MB
          </p>
          <ul className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((photo) => (
              <li key={photo.id} className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#1F2A36] dark:bg-[#151B23]">
                <img src={photo.previewUrl} alt="" className="h-28 w-full object-cover sm:h-32" />
                <div className="space-y-2 p-2.5">
                  <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-200" title={photo.file.name}>
                    {photo.file.name}
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    className="min-h-9 w-full !px-2 !py-1.5 text-xs"
                    onClick={() => onRemovePhoto(photo.id)}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-[#151B23]/80 dark:text-[#94A3B8]">
          No photos yet
        </p>
      )}
    </section>
  )
}
