import { lazy, Suspense, useId, useMemo, useState } from 'react'
import { PHOTO_LABEL_COPY, type PhotoLabelId } from '../../lib/taskPhotoLabels'
import { MAX_TASK_PHOTO_BYTES } from '../../lib/taskPhotoUtils'
import { Button } from '../ui/Button'

const PhotoMarkupEditor = lazy(async () => {
  const m = await import('../photo-markup/PhotoMarkupEditor')
  return { default: m.PhotoMarkupEditor }
})

/** Labels available when attaching photos before the job row exists (no TaskPhotoUploadModal). */
const CREATION_LABEL_IDS = ['before', 'after', 'reference'] as const satisfies readonly PhotoLabelId[]

export type PendingJobPhoto = {
  id: string
  file: File
  previewUrl: string
  label: PhotoLabelId
  /** Present after user saves markup in the editor; this is what uploads on Create job. */
  markedUpFile?: File
  markedUpPreviewUrl?: string
}

const THUMB_SIZE_PX = 72

export function CreateJobPhotosSection({
  photos,
  onAddPhotos,
  onRemovePhoto,
  onChangeLabel,
  onMarkupSave,
}: {
  photos: PendingJobPhoto[]
  onAddPhotos: (photos: PendingJobPhoto[]) => void
  onRemovePhoto: (photoId: string) => void
  onChangeLabel: (photoId: string, label: PhotoLabelId) => void
  /** Persist markup as local File + preview URL (no DB until Create job). */
  onMarkupSave: (photoId: string, mergedDataUrl: string) => void
}) {
  const inputId = useId()
  const [markupPhotoId, setMarkupPhotoId] = useState<string | null>(null)

  const markupPhoto = markupPhotoId ? photos.find((p) => p.id === markupPhotoId) : undefined
  const editorSrc = markupPhoto
    ? markupPhoto.markedUpPreviewUrl ?? markupPhoto.previewUrl
    : null

  const totalSize = useMemo(
    () => photos.reduce((sum, p) => sum + (p.markedUpFile?.size ?? p.file.size), 0),
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
        label: 'reference' as PhotoLabelId,
      }))

    if (next.length > 0) onAddPhotos(next)
  }

  return (
    <>
      {markupPhotoId && editorSrc ? (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 text-sm text-slate-400">
              Loading editor…
            </div>
          }
        >
          <PhotoMarkupEditor
            key={editorSrc}
            imageSrc={editorSrc}
            onClose={() => setMarkupPhotoId(null)}
            onSave={(dataUrl) => {
              onMarkupSave(markupPhotoId, dataUrl)
              setMarkupPhotoId(null)
            }}
          />
        </Suspense>
      ) : null}

      <section className="min-w-0 shrink-0 rounded-[18px] border border-slate-200 bg-slate-50/50 p-3 dark:border-[#1F2A36] dark:bg-[#11161D]">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">Photos</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-[#94A3B8]">
            Stored locally until you create the job. Thumbnails below scroll if you add several.
          </p>
        </div>
        <label
          htmlFor={inputId}
          className="inline-flex min-h-11 w-full shrink-0 cursor-pointer items-center justify-center rounded-[13px] bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-within:ring-2 focus-within:ring-emerald-400 focus-within:ring-offset-2 dark:focus-within:ring-offset-[#11161D] sm:w-auto"
        >
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
        <div className="mt-3 min-h-0 shrink-0 space-y-1.5">
          <p className="text-[11px] font-medium text-slate-500 dark:text-[#94A3B8]">
            {photos.length} selected · {(totalSize / (1024 * 1024)).toFixed(1)} MB
          </p>
          <div className="scroll-momentum max-h-[180px] overflow-y-auto overflow-x-hidden overscroll-contain rounded-lg border border-slate-200/80 bg-white/60 px-1.5 py-1 dark:border-[#1F2A36] dark:bg-[#151B23]/60">
            <ul className="min-w-0 divide-y divide-slate-100 dark:divide-[#1F2A36]">
              {photos.map((photo) => (
                <li key={photo.id} className="flex gap-2 py-2 first:pt-1 last:pb-1">
                  <img
                    src={photo.markedUpPreviewUrl ?? photo.previewUrl}
                    alt=""
                    width={THUMB_SIZE_PX}
                    height={THUMB_SIZE_PX}
                    className="h-[72px] w-[72px] max-h-[72px] shrink-0 rounded-md border border-slate-200 object-cover dark:border-[#1F2A36]"
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-[11px] font-medium text-slate-800 dark:text-slate-200"
                      title={photo.file.name}
                    >
                      {photo.file.name}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {CREATION_LABEL_IDS.map((id) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => onChangeLabel(photo.id, id)}
                          className={`min-h-7 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 ${
                            photo.label === id
                              ? 'bg-blue-600 text-white dark:bg-blue-500'
                              : 'border border-slate-200 bg-slate-50 text-slate-700 dark:border-[#1F2A36] dark:bg-[#11161D] dark:text-slate-200'
                          }`}
                        >
                          {PHOTO_LABEL_COPY[id]}
                        </button>
                      ))}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <Button
                        type="button"
                        variant="secondary"
                        className="min-h-8 !px-2.5 !py-1 text-[11px]"
                        onClick={() => setMarkupPhotoId(photo.id)}
                      >
                        {photo.markedUpFile ? 'Edit markup' : 'Markup'}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="min-h-8 !px-2 !py-1 text-[11px]"
                        onClick={() => onRemovePhoto(photo.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <p className="mt-3 rounded-xl border border-dashed border-slate-200 bg-white/70 px-3 py-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-[#151B23]/80 dark:text-[#94A3B8]">
          No photos yet
        </p>
      )}
    </section>
    </>
  )
}
