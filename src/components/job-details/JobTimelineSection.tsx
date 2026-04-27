import { useMemo, useState } from 'react'
import { useAppData } from '../../hooks/useAppData'
import { useAuth } from '../../hooks/useAuth'
import { canViewTaskPhoto } from '../../lib/photoAccess'
import { formatPhotoTimestamp } from '../../lib/photoFormat'
import { PHOTO_LABEL_COPY, photoLabelBadgeClass } from '../../lib/taskPhotoLabels'
import type { Job, TaskPhoto } from '../../types'
import { TaskPhotoPreviewModal } from '../execution/TaskPhotoPreviewModal'

type TimelineEvent =
  | { id: string; kind: 'status'; at: string; title: string; detail: string }
  | { id: string; kind: 'photo'; at: string; photo: TaskPhoto; taskTitle: string }

export function JobTimelineSection({ job }: { job: Job }) {
  const { jobTasks, taskPhotos } = useAppData()
  const { user } = useAuth()
  const [preview, setPreview] = useState<TaskPhoto | null>(null)

  const events = useMemo(() => {
    const tasks = jobTasks.filter((task) => task.job_id === job.id)
    const taskTitleById = new Map(tasks.map((task) => [task.id, task.title]))
    const taskIds = new Set(tasks.map((task) => task.id))
    const rows: TimelineEvent[] = []

    if (job.work_started_at) {
      rows.push({
        id: `${job.id}-started`,
        kind: 'status',
        at: job.work_started_at,
        title: 'Job started',
        detail: 'Crew started work on site.',
      })
    }

    for (const photo of taskPhotos) {
      if (!taskIds.has(photo.task_id) || !canViewTaskPhoto(photo, user)) continue
      rows.push({
        id: photo.id,
        kind: 'photo',
        at: photo.created_at,
        photo,
        taskTitle: taskTitleById.get(photo.task_id) ?? 'Job photo',
      })
    }

    if (job.work_completed_at) {
      rows.push({
        id: `${job.id}-completed`,
        kind: 'status',
        at: job.work_completed_at,
        title: job.status === 'verified' ? 'Work completed' : 'Submitted for verification',
        detail:
          job.status === 'verified'
            ? 'Completion package was submitted before verification.'
            : 'Crew completed work and submitted proof for admin review.',
      })
    }

    if (job.status === 'verified') {
      rows.push({
        id: `${job.id}-verified`,
        kind: 'status',
        at: job.work_completed_at ?? new Date().toISOString(),
        title: 'Job verified',
        detail: 'Admin approved checklist, notes, and proof photos.',
      })
    }

    return rows.sort((a, b) => a.at.localeCompare(b.at))
  }, [job, jobTasks, taskPhotos, user])

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm shadow-slate-900/[0.03] dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            Job history
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-gray-400">
            Chronological proof-of-work timeline with timestamps, uploader identity, task context, and photos.
          </p>
        </div>
        {job.requires_photos ? (
          <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-800 ring-1 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-200 dark:ring-blue-500/25">
            Proof required
          </span>
        ) : null}
      </div>

      {events.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/90 px-4 py-8 text-center text-[15px] text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-gray-400">
          No history yet. Start work or upload photos to build the job record.
        </p>
      ) : (
        <ol className="mt-5 space-y-4">
          {events.map((event) => (
            <li key={event.id} className="relative pl-5">
              <span className="absolute left-0 top-2 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50 dark:ring-emerald-950/50" />
              {event.kind === 'status' ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/55">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900 dark:text-white">{event.title}</p>
                    <time className="text-xs font-medium tabular-nums text-slate-500 dark:text-gray-400" dateTime={event.at}>
                      {formatPhotoTimestamp(event.at)}
                    </time>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-gray-300">{event.detail}</p>
                </div>
              ) : (
                <button
                  type="button"
                  className="grid w-full gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-px hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-[8rem_minmax(0,1fr)]"
                  onClick={() => setPreview(event.photo)}
                >
                  <img
                    src={event.photo.image_url}
                    alt={event.photo.note.trim() || `${PHOTO_LABEL_COPY[event.photo.label]} proof photo`}
                    className="aspect-[4/3] w-full rounded-xl object-cover"
                    loading="lazy"
                  />
                  <span className="min-w-0">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ${photoLabelBadgeClass(event.photo.label)}`}>
                      {PHOTO_LABEL_COPY[event.photo.label]}
                    </span>
                    <span className="mt-2 block text-sm font-semibold text-slate-900 dark:text-white">
                      {event.taskTitle}
                    </span>
                    {event.photo.note.trim() ? (
                      <span className="mt-1 block text-sm leading-relaxed text-slate-600 dark:text-gray-300">
                        {event.photo.note}
                      </span>
                    ) : null}
                    <span className="mt-3 flex flex-wrap gap-x-2 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-gray-400">
                      <span className="font-semibold text-slate-700 dark:text-gray-200">
                        {event.photo.uploaded_by || 'Unknown uploader'}
                      </span>
                      <span aria-hidden>·</span>
                      <time dateTime={event.at}>{formatPhotoTimestamp(event.at)}</time>
                    </span>
                  </span>
                </button>
              )}
            </li>
          ))}
        </ol>
      )}

      <TaskPhotoPreviewModal
        photo={preview}
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
      />
    </section>
  )
}
