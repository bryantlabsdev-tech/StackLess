import { useId } from 'react'
import type { JobTask, TaskPhoto } from '../../types'
import { DirectPhotoCaptureButtons } from '../execution/DirectPhotoCaptureButtons'
import { TaskPhotoGrid } from './TaskPhotoGrid'

export function TaskCard({
  task,
  photos,
  expanded,
  onToggleExpand,
  onToggleDone,
  photoNote,
  onPhotoNoteChange,
  onPhotoClick,
  onEditPhoto,
  disabled,
}: {
  task: JobTask
  photos: TaskPhoto[]
  expanded: boolean
  onToggleExpand: () => void
  onToggleDone: (done: boolean) => void
  photoNote: string
  onPhotoNoteChange: (value: string) => void
  onPhotoClick: (p: TaskPhoto) => void
  onEditPhoto?: (p: TaskPhoto) => void
  disabled?: boolean
}) {
  const noteId = useId()
  const done = task.is_completed

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-[box-shadow,border-color] duration-300 ease-out dark:bg-slate-900 ${
        expanded
          ? 'border-emerald-300/80 shadow-md shadow-emerald-900/[0.06] dark:border-emerald-700/60 dark:shadow-emerald-950/20'
          : 'border-slate-200/90 shadow-slate-900/[0.03] dark:border-slate-800 dark:shadow-black/20'
      }`}
    >
      <div className="flex gap-3 p-4 sm:gap-4">
        <label className="flex shrink-0 cursor-pointer pt-0.5">
          <input
            type="checkbox"
            checked={done}
            disabled={disabled}
            onChange={(e) => onToggleDone(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
            className="h-8 w-8 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-600"
          />
          <span className="sr-only">Mark task complete</span>
        </label>

        <button
          type="button"
          onClick={onToggleExpand}
          className="min-w-0 flex-1 rounded-xl text-left transition hover:bg-slate-50/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 dark:hover:bg-slate-800/80"
        >
          <span className="flex items-start justify-between gap-2">
            <span>
              <span className="block text-lg font-semibold leading-snug text-gray-900 dark:text-white">{task.title}</span>
              {task.description.trim() && !expanded ? (
                <span className="mt-1 block text-[15px] leading-relaxed text-slate-600 dark:text-gray-400 line-clamp-2">
                  {task.description}
                </span>
              ) : null}
            </span>
            <span
              className={`mt-0.5 shrink-0 text-slate-400 transition-transform duration-300 ease-out dark:text-gray-500 ${
                expanded ? 'rotate-180' : ''
              }`}
              aria-hidden
            >
              ▼
            </span>
          </span>
        </button>
      </div>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="space-y-6 border-t border-slate-100 px-4 pb-6 pt-4 dark:border-slate-800">
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-gray-400">
                Photos & proof
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-gray-400">
                Tap a photo to view full size. Use the green <span className="font-semibold text-emerald-800 dark:text-emerald-300">Edit photo</span> bar to change label, note, or markup later.
              </p>
              <div className="mt-4">
                <TaskPhotoGrid
                  photos={photos}
                  onPhotoClick={onPhotoClick}
                  onEditPhoto={onEditPhoto}
                  canEdit={!disabled && Boolean(onEditPhoto)}
                />
              </div>
              {photos.length === 0 ? (
                <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/90 px-4 py-6 text-center text-[15px] text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-gray-400">
                  No photos yet
                </p>
              ) : null}
            </div>

            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-gray-400">
                What to do
              </h3>
              {task.description.trim() ? (
                <p className="mt-3 whitespace-pre-wrap text-[16px] leading-relaxed text-slate-900 dark:text-gray-100">
                  {task.description}
                </p>
              ) : (
                <p className="mt-3 text-[15px] text-slate-500 dark:text-gray-500">
                  No written instructions — follow the job notes above or ask the office.
                </p>
              )}
            </div>

            <div>
              <label htmlFor={noteId} className="text-sm font-semibold text-slate-800 dark:text-gray-200">
                Note for your next photo
              </label>
              <p className="mt-1 text-xs text-slate-500 dark:text-gray-500">
                Optional reminder of what you’ll photograph next.
              </p>
              <textarea
                id={noteId}
                value={photoNote}
                onChange={(e) => onPhotoNoteChange(e.target.value)}
                disabled={disabled}
                rows={3}
                placeholder="Photo note"
                className="mt-3 min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-[16px] leading-relaxed text-gray-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>

            <DirectPhotoCaptureButtons
              jobId={task.job_id}
              taskId={task.id}
              disabled={disabled}
              notePrefix={photoNote.trim() || task.title}
            />
          </div>
        </div>
      </div>
    </article>
  )
}
