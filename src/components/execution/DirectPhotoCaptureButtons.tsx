import { useRef, useState } from 'react'
import { useAppData } from '../../hooks/useAppData'
import { useAuth } from '../../hooks/useAuth'
import { useFeedback } from '../../hooks/useFeedback'
import { deleteStoredJobPhoto, uploadJobPhotoBlob } from '../../lib/jobPhotoStorage'
import { MAX_TASK_PHOTO_BYTES } from '../../lib/taskPhotoUtils'
import type { PhotoLabelId } from '../../types'

type CaptureLabel = Extract<PhotoLabelId, 'before' | 'after'>

const labels: Record<CaptureLabel, string> = {
  before: 'Before photo',
  after: 'After photo',
}

const buttonStyles: Record<CaptureLabel, string> = {
  before:
    'border-blue-200 bg-blue-50 text-blue-900 hover:border-blue-300 hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100 dark:hover:bg-blue-500/20',
  after:
    'border-emerald-200 bg-emerald-50 text-emerald-950 hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100 dark:hover:bg-emerald-500/20',
}

function fileError(file: File) {
  if (!file.type.startsWith('image/')) return 'Choose an image file.'
  if (file.size > MAX_TASK_PHOTO_BYTES) {
    return `Keep images under ${Math.round(MAX_TASK_PHOTO_BYTES / (1024 * 1024))}MB.`
  }
  return null
}

export function DirectPhotoCaptureButtons({
  jobId,
  taskId,
  disabled,
  notePrefix,
  className = '',
}: {
  jobId: string
  taskId: string | null
  disabled?: boolean
  notePrefix?: string
  className?: string
}) {
  const { user } = useAuth()
  const { addTaskPhoto } = useAppData()
  const { notify } = useFeedback()
  const beforeInputRef = useRef<HTMLInputElement | null>(null)
  const afterInputRef = useRef<HTMLInputElement | null>(null)
  const inputRefs = {
    before: beforeInputRef,
    after: afterInputRef,
  }
  const [busyLabel, setBusyLabel] = useState<CaptureLabel | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const [retry, setRetry] = useState<{ label: CaptureLabel; file: File } | null>(null)

  const canCapture = Boolean(user && taskId && !disabled && !busyLabel)

  async function handleFile(label: CaptureLabel, file: File | null) {
    setError(null)
    setProgress(null)
    if (!file) return

    const validationError = fileError(file)
    if (validationError) {
      setError(validationError)
      return
    }

    if (!user || !taskId) {
      setError('This job needs a task before photos can be saved.')
      return
    }

    setBusyLabel(label)
    setRetry(null)
    try {
      setProgress('Uploading photo...')
      const upload = await uploadJobPhotoBlob({
        blob: file,
        fileName: file.name,
        jobId,
        userId: user.id,
      })
      setProgress('Saving photo to job...')
      try {
        await addTaskPhoto({
          task_id: taskId,
          image_url: upload.imageUrl,
          storage_path: upload.storagePath,
          label,
          note: notePrefix ? `${notePrefix} - ${labels[label]}` : labels[label],
          uploaded_by_id: user.id,
          uploaded_by: user.full_name?.trim() || 'StackLess user',
        })
      } catch (error) {
        await deleteStoredJobPhoto(upload.storagePath).catch((cleanupError) =>
          console.error('Failed to clean up orphaned job photo', cleanupError),
        )
        throw error
      }
      notify({ tone: 'success', title: `${labels[label]} uploaded` })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not upload that photo.'
      setError(message)
      setRetry({ label, file })
      notify({
        tone: 'error',
        title: `${labels[label]} failed`,
        detail: message,
      })
    } finally {
      setBusyLabel(null)
      setProgress(null)
      const input = inputRefs[label].current
      if (input) input.value = ''
    }
  }

  return (
    <div className={className}>
      <div className="grid gap-2 min-[430px]:grid-cols-2">
        {(['before', 'after'] as const).map((label) => (
          <div key={label}>
            <input
              ref={inputRefs[label]}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              disabled={!canCapture}
              onChange={(event) => void handleFile(label, event.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              className={`inline-flex min-h-[52px] w-full touch-manipulation items-center justify-center rounded-2xl border px-4 py-2.5 text-base font-bold transition hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-50 ${buttonStyles[label]}`}
              disabled={!canCapture}
              onClick={() => inputRefs[label].current?.click()}
            >
              {busyLabel === label ? 'Uploading...' : labels[label]}
            </button>
          </div>
        ))}
      </div>
      {error ? (
        <p className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100">
          {error}
        </p>
      ) : null}
      {progress ? (
        <div className="mt-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-950 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500" aria-hidden />{' '}
          {progress}
        </div>
      ) : null}
      {retry ? (
        <button
          type="button"
          className="mt-2 inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100 dark:hover:bg-slate-800"
          disabled={Boolean(busyLabel)}
          onClick={() => void handleFile(retry.label, retry.file)}
        >
          Retry {labels[retry.label]}
        </button>
      ) : null}
      {!taskId ? (
        <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
          Add a task before capturing photos.
        </p>
      ) : null}
    </div>
  )
}
