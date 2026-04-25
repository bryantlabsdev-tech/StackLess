import { lazy, Suspense, useId, useState } from 'react'
import { Button } from '../ui/Button'

const PhotoMarkupEditor = lazy(async () => {
  const m = await import('../photo-markup/PhotoMarkupEditor')
  return { default: m.PhotoMarkupEditor }
})
import { Modal } from '../ui/Modal'
import type { TaskPhoto } from '../../types'
import {
  PHOTO_LABEL_COPY,
  PHOTO_LABEL_IDS,
  type PhotoLabelId,
} from '../../lib/taskPhotoLabels'
import { MAX_TASK_PHOTO_BYTES } from '../../lib/taskPhotoUtils'

export function TaskPhotoUploadModal({
  open,
  onClose,
  onSubmit,
  initialNote = '',
  mode = 'create',
  editingPhoto = null,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (input: {
    image_url: string
    note: string
    label: PhotoLabelId
    /** When set, update this row instead of inserting. */
    photoId?: string
  }) => void
  initialNote?: string
  mode?: 'create' | 'edit'
  editingPhoto?: TaskPhoto | null
}) {
  const fileId = useId()
  const labelGroupId = useId()
  const isEdit = mode === 'edit' && editingPhoto != null

  const [note, setNote] = useState(initialNote)
  const [photoLabel, setPhotoLabel] = useState<PhotoLabelId>(
    isEdit && editingPhoto ? editingPhoto.label : 'reference',
  )
  const [fileName, setFileName] = useState<string | null>(null)
  const [rawDataUrl, setRawDataUrl] = useState<string | null>(() =>
    isEdit && editingPhoto ? editingPhoto.image_url : null,
  )
  const [mergedDataUrl, setMergedDataUrl] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const previewUrl = mergedDataUrl ?? rawDataUrl
  const editorBaseSrc = mergedDataUrl ?? rawDataUrl

  const reset = () => {
    setNote('')
    setPhotoLabel('reference')
    setFileName(null)
    setRawDataUrl(null)
    setMergedDataUrl(null)
    setEditorOpen(false)
    setError(null)
    setBusy(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFile = (file: File | null) => {
    setError(null)
    setMergedDataUrl(null)
    setFileName(null)
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file.')
      return
    }
    if (file.size > MAX_TASK_PHOTO_BYTES) {
      setError(`Keep images under ${Math.round(MAX_TASK_PHOTO_BYTES / (1024 * 1024))}MB.`)
      return
    }
    setBusy(true)
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      setRawDataUrl(url)
      setMergedDataUrl(null)
      setBusy(false)
      setEditorOpen(true)
    }
    reader.onerror = () => {
      setError('Could not read that file.')
      setBusy(false)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = () => {
    const url = mergedDataUrl ?? rawDataUrl
    if (!url) {
      setError('Add a photo first.')
      return
    }
    onSubmit({
      image_url: url,
      note: note.trim(),
      label: photoLabel,
      photoId: isEdit && editingPhoto ? editingPhoto.id : undefined,
    })
    reset()
    onClose()
  }

  return (
    <>
      {editorOpen && editorBaseSrc ? (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 text-sm text-slate-400">
              Loading editor…
            </div>
          }
        >
          <PhotoMarkupEditor
            key={editorBaseSrc}
            imageSrc={editorBaseSrc}
            onClose={() => setEditorOpen(false)}
            onSave={(dataUrl) => {
              setMergedDataUrl(dataUrl)
              setEditorOpen(false)
            }}
          />
        </Suspense>
      ) : null}

      <Modal
        open={open}
        onClose={handleClose}
        title="Instruction photo"
        description="Choose a label, add a note, and mark up the image if needed. Changes apply when you save."
        wide
        footer={
          <>
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={busy || !previewUrl}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                isEdit
                  ? 'bg-amber-100 text-amber-950 ring-1 ring-amber-200/90 dark:bg-amber-950/60 dark:text-amber-100 dark:ring-amber-800'
                  : 'bg-emerald-100 text-emerald-950 ring-1 ring-emerald-200/90 dark:bg-emerald-950/50 dark:text-emerald-100 dark:ring-emerald-800'
              }`}
            >
              {isEdit ? 'Editing saved' : 'New photo'}
            </span>
            {isEdit ? (
              <p className="text-xs text-slate-500 dark:text-gray-500">
                Updates the same photo for everyone — use <span className="font-medium text-slate-700 dark:text-gray-300">Mark up</span> to draw on top, or{' '}
                <span className="font-medium text-slate-700 dark:text-gray-300">Replace</span> for a new file.
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor={fileId} className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Photo
            </label>
            <label className="mt-2 flex min-h-[8.5rem] cursor-pointer flex-col items-center justify-center rounded-[18px] border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center transition hover:-translate-y-px hover:border-blue-300 hover:bg-blue-50/40 dark:border-[#1F2A36] dark:bg-[#151B23] dark:hover:border-blue-500/45 dark:hover:bg-blue-500/5">
              <input
                id={fileId}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
              <span className="text-sm font-semibold text-slate-800 dark:text-[#F8FAFC]">
                {rawDataUrl && !isEdit ? 'Replace photo' : isEdit ? 'Replace image file' : 'Upload or take a photo'}
              </span>
              <span className="mt-1 text-xs text-slate-500 dark:text-[#94A3B8]">
                JPG, PNG, WebP · max 2MB
              </span>
            </label>
            {fileName ? (
              <p className="mt-2 text-xs text-slate-600 dark:text-gray-400">
                <span className="font-medium">{fileName}</span>
              </p>
            ) : null}
            {previewUrl ? (
              <div className="mt-4 space-y-2">
                <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white p-2 dark:border-[#1F2A36] dark:bg-[#151B23]">
                  <img
                    key={`${isEdit && editingPhoto ? editingPhoto.id : 'new'}-${mergedDataUrl ? 'm' : 'r'}-${previewUrl.length}`}
                    src={previewUrl}
                    alt=""
                    className="mx-auto max-h-64 w-auto rounded-lg object-contain"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="min-h-[44px] text-sm"
                    onClick={() => setEditorOpen(true)}
                  >
                    {mergedDataUrl ? 'Edit markup' : 'Mark up'}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
          <div>
            <p id={labelGroupId} className="text-sm font-medium text-slate-700 dark:text-gray-300">
              Photo label <span className="text-red-600 dark:text-red-400">*</span>
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-gray-500">
              What kind of shot is this? You can change it before saving.
            </p>
            <div
            className="mt-3 grid gap-2 min-[420px]:grid-cols-2"
              role="group"
              aria-labelledby={labelGroupId}
            >
              {PHOTO_LABEL_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPhotoLabel(id)}
                  className={`min-h-[44px] rounded-[14px] border px-3.5 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 ${
                    photoLabel === id
                      ? 'border-blue-500 bg-blue-50 text-blue-950 shadow-sm dark:border-blue-500 dark:bg-blue-500/10 dark:text-blue-100'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-[#1F2A36] dark:bg-[#151B23] dark:text-slate-200 dark:hover:border-slate-600'
                  }`}
                >
                  {PHOTO_LABEL_COPY[id]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="tp-note" className="block text-sm font-medium text-slate-700 dark:text-gray-300">
              Note <span className="font-normal text-slate-400 dark:text-gray-500">(optional)</span>
            </label>
            <textarea
              id="tp-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Short label for this instruction"
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base text-gray-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 sm:text-sm"
            />
          </div>
          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </p>
          ) : null}
        </div>
      </Modal>
    </>
  )
}
