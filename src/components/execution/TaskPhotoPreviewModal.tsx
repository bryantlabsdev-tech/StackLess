import { useEffect } from 'react'
import { Button } from '../ui/Button'
import type { TaskPhoto } from '../../types'
import { formatPhotoTimestamp } from '../../lib/photoFormat'
import { taskPhotoRevisionKey } from '../../lib/taskPhotoDisplay'
import { PHOTO_LABEL_COPY, photoLabelBadgeClass } from '../../lib/taskPhotoLabels'

export function TaskPhotoPreviewModal({
  photo,
  open,
  onClose,
  onDelete,
  onEdit,
}: {
  photo: TaskPhoto | null
  open: boolean
  onClose: () => void
  onDelete?: (id: string) => void
  onEdit?: (photo: TaskPhoto) => void
}) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !photo) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/88 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl bg-slate-900 shadow-2xl sm:max-h-[92vh] sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/10 bg-slate-900 px-3 py-2.5 pr-2 sm:px-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${photoLabelBadgeClass(photo.label)}`}
            >
              {PHOTO_LABEL_COPY[photo.label]}
            </span>
            <p className="truncate text-xs text-slate-400 sm:text-sm">
              <span className="text-slate-500">{photo.uploaded_by}</span>
              <span className="mx-1.5 text-slate-600">·</span>
              <span className="tabular-nums">{formatPhotoTimestamp(photo.created_at)}</span>
              {photo.updated_at ? (
                <>
                  <span className="mx-1.5 text-slate-600">·</span>
                  <span className="text-slate-500">Updated {formatPhotoTimestamp(photo.updated_at)}</span>
                </>
              ) : null}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {onEdit ? (
              <Button
                type="button"
                className="min-h-[40px] px-4 text-sm font-semibold shadow-sm shadow-emerald-900/20 dark:shadow-emerald-950/40"
                onClick={() => {
                  onEdit(photo)
                  onClose()
                }}
              >
                Edit
              </Button>
            ) : null}
            {onDelete ? (
              <Button
                type="button"
                variant="danger"
                className="min-h-[40px] px-3 text-xs font-semibold"
                onClick={() => {
                  if (window.confirm('Delete this photo?')) {
                    onDelete(photo.id)
                    onClose()
                  }
                }}
              >
                Delete
              </Button>
            ) : null}
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg leading-none text-slate-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Close"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>
        <div className="scroll-momentum min-h-0 overflow-y-auto overscroll-contain">
          <div className="flex justify-center bg-black/50 p-3 sm:p-6">
            <img
              key={taskPhotoRevisionKey(photo)}
              src={photo.image_url}
              alt=""
              className="max-h-[min(70dvh,800px)] w-auto max-w-full rounded-lg object-contain"
            />
          </div>
          {photo.note.trim() ? (
            <div className="border-t border-white/10 px-4 py-4 text-sm leading-relaxed text-slate-200 sm:px-6">
              {photo.note}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
