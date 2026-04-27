import { useMemo, useRef, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useAppData } from '../../hooks/useAppData'
import {
  deleteStoredJobPhoto,
  isDataUrl,
  uploadJobPhotoFromDataUrl,
} from '../../lib/jobPhotoStorage'
import { canManageTaskPhoto, canViewTaskPhoto } from '../../lib/photoAccess'
import type { Job, TaskPhoto } from '../../types'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { TaskPhotoPreviewModal } from '../execution/TaskPhotoPreviewModal'
import { TaskPhotoUploadModal } from '../execution/TaskPhotoUploadModal'
import { TaskCard } from './TaskCard'

export function TaskList({
  job,
  showAddTask,
  canEdit,
}: {
  job: Job
  showAddTask: boolean
  canEdit: boolean
}) {
  const {
    jobTasks,
    taskPhotos,
    updateJobTask,
    addJobTask,
    updateTaskPhoto,
    deleteTaskPhoto,
  } = useAppData()
  const { user } = useAuth()

  const tasks = useMemo(
    () => jobTasks.filter((t) => t.job_id === job.id),
    [jobTasks, job.id],
  )

  const doneCount = useMemo(() => tasks.filter((t) => t.is_completed).length, [tasks])

  const photosByTask = useMemo(() => {
    const m = new Map<string, TaskPhoto[]>()
    for (const p of taskPhotos) {
      if (!canViewTaskPhoto(p, user)) continue
      if (!m.has(p.task_id)) m.set(p.task_id, [])
      m.get(p.task_id)!.push(p)
    }
    return m
  }, [taskPhotos, user])

  const [expandedId, setExpandedId] = useState<string | null>(() => tasks[0]?.id ?? null)
  const activeExpandedId = useMemo(() => {
    if (tasks.length === 0) return null
    if (expandedId && tasks.some((t) => t.id === expandedId)) return expandedId
    return tasks[0]?.id ?? null
  }, [tasks, expandedId])
  const [photoNotes, setPhotoNotes] = useState<Record<string, string>>({})
  const uploadSessionSeq = useRef(0)
  const [uploadSession, setUploadSession] = useState<
    { kind: 'edit'; photo: TaskPhoto; key: number } | null
  >(null)
  const [preview, setPreview] = useState<TaskPhoto | null>(null)

  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const toggleExpand = (id: string) => {
    setExpandedId((cur) => (cur === id ? null : id))
  }

  const openEditPhoto = (photo: TaskPhoto) => {
    if (!canEdit || !canManageTaskPhoto(photo, user)) return
    uploadSessionSeq.current += 1
    setUploadSession({ kind: 'edit', photo, key: uploadSessionSeq.current })
  }

  const getNote = (taskId: string) => photoNotes[taskId] ?? ''

  const setNote = (taskId: string, value: string) => {
    setPhotoNotes((prev) => ({ ...prev, [taskId]: value }))
  }

  const addTask = () => {
    void (async () => {
      if (!newTitle.trim()) return
      const row = await addJobTask(job.id, { title: newTitle.trim(), description: newDesc })
      setNewTitle('')
      setNewDesc('')
      setExpandedId(row.id)
    })()
  }

  const handleDeletePhoto = (photoId: string) => {
    const photo = taskPhotos.find((p) => p.id === photoId)
    if (!photo || !canEdit || !canManageTaskPhoto(photo, user)) return
    void deleteTaskPhoto(photoId)
  }

  return (
    <div className="space-y-4">
      {tasks.length > 0 ? (
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/90 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-800 dark:text-gray-200">
              Progress · {doneCount} of {tasks.length} tasks done
            </p>
            {doneCount === tasks.length ? (
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                All tasks complete
              </span>
            ) : null}
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200/90 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-emerald-500 transition-[width] duration-500 ease-out dark:bg-emerald-500"
              style={{ width: `${tasks.length ? (doneCount / tasks.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      ) : null}

      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-amber-200/90 bg-amber-50/80 px-4 py-8 text-center dark:border-amber-900/50 dark:bg-amber-950/30 sm:px-6 sm:py-10">
          <p className="text-[15px] font-semibold text-amber-950 dark:text-amber-100">Photos need a task</p>
          <p className="mt-2 text-[15px] leading-relaxed text-amber-900/85 dark:text-amber-200/85">
            Instruction photos are saved under a task.{' '}
            {showAddTask
              ? 'Add a task below, then expand it and use Add photo.'
              : 'Add a task to this job, then attach photos.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li key={task.id}>
              <TaskCard
                task={task}
                photos={photosByTask.get(task.id) ?? []}
                expanded={activeExpandedId === task.id}
                onToggleExpand={() => toggleExpand(task.id)}
                onToggleDone={(done) => {
                  void updateJobTask(task.id, { is_completed: done })
                }}
                photoNote={getNote(task.id)}
                onPhotoNoteChange={(v) => setNote(task.id, v)}
                onPhotoClick={setPreview}
                onEditPhoto={canEdit ? openEditPhoto : undefined}
                disabled={!canEdit}
              />
            </li>
          ))}
        </ul>
      )}

      {showAddTask ? (
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-900/60 sm:p-5">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Add task</p>
          <div className="mt-3 space-y-3">
            <Input
              label="Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task title"
            />
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">
              Instructions
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={2}
                className="mt-1 min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-base text-gray-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:text-sm"
                placeholder="What needs to happen"
              />
            </label>
            <Button type="button" className="min-h-[48px] w-full rounded-2xl font-semibold" onClick={addTask} disabled={!newTitle.trim()}>
              Add task
            </Button>
          </div>
        </div>
      ) : null}

      <TaskPhotoUploadModal
        key={
          uploadSession
            ? `${uploadSession.kind}-${uploadSession.photo.id}-${uploadSession.key}`
            : 'closed'
        }
        open={uploadSession !== null}
        mode="edit"
        editingPhoto={uploadSession?.photo ?? null}
        initialNote={uploadSession?.photo.note ?? ''}
        onClose={() => setUploadSession(null)}
        onSubmit={async (input) => {
          if (!user || !canEdit) {
            throw new Error('You do not have access to manage photos for this job.')
          }

          if (!input.photoId) return
          const current = taskPhotos.find((p) => p.id === input.photoId)
          if (!current || !canManageTaskPhoto(current, user)) {
            throw new Error('You can only edit your own uploads.')
          }
          const upload = isDataUrl(input.image_url)
            ? await uploadJobPhotoFromDataUrl({
              dataUrl: input.image_url,
              fileName: input.file_name,
              jobId: job.id,
                storagePath: current?.storage_path,
              userId: user.id,
            })
            : null
          try {
            await updateTaskPhoto(input.photoId, {
              image_url: upload?.imageUrl ?? input.image_url,
              storage_path: upload?.storagePath ?? current?.storage_path ?? null,
              label: input.label,
              note: input.note,
            })
          } catch (error) {
            if (upload?.storagePath && upload.storagePath !== (current?.storage_path ?? null)) {
              await deleteStoredJobPhoto(upload.storagePath).catch((cleanupError: unknown) =>
                console.error('Failed to clean up orphaned job photo', cleanupError),
              )
            }
            throw error
          }
        }}
      />

      <TaskPhotoPreviewModal
        photo={preview}
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        onDelete={canEdit ? handleDeletePhoto : undefined}
        onEdit={canEdit ? (p) => openEditPhoto(p) : undefined}
      />
    </div>
  )
}
