import { useMemo, useRef, useState } from 'react'
import { useAppData } from '../../hooks/useAppData'
import { useAuth } from '../../hooks/useAuth'
import {
  deleteStoredJobPhoto,
  isDataUrl,
  uploadJobPhotoFromDataUrl,
} from '../../lib/jobPhotoStorage'
import { canManageTaskPhoto, canViewTaskPhoto } from '../../lib/photoAccess'
import type { Job, TaskPhoto } from '../../types'
import { TaskPhotoPreviewModal } from '../execution/TaskPhotoPreviewModal'
import { TaskPhotoUploadModal } from '../execution/TaskPhotoUploadModal'
import { Button } from '../ui/Button'
import { TaskPhotoGrid } from './TaskPhotoGrid'

export function JobPhotosSection({
  job,
  canManage,
}: {
  job: Job
  canManage: boolean
}) {
  const {
    addJobTask,
    addTaskPhoto,
    deleteTaskPhoto,
    jobTasks,
    taskPhotos,
    updateTaskPhoto,
  } = useAppData()
  const { user } = useAuth()
  const uploadedBy = user?.full_name?.trim() || 'StackLess user'
  const uploadSessionSeq = useRef(0)

  const tasks = useMemo(
    () => jobTasks.filter((t) => t.job_id === job.id),
    [jobTasks, job.id],
  )
  const taskIds = useMemo(() => new Set(tasks.map((t) => t.id)), [tasks])
  const photos = useMemo(
    () => taskPhotos.filter((p) => taskIds.has(p.task_id) && canViewTaskPhoto(p, user)),
    [taskIds, taskPhotos, user],
  )

  const [uploadSession, setUploadSession] = useState<
    | { kind: 'create'; taskId: string; key: number }
    | { kind: 'edit'; photo: TaskPhoto; key: number }
    | null
  >(null)
  const [preview, setPreview] = useState<TaskPhoto | null>(null)

  const openUpload = () => {
    if (!canManage) return
    void (async () => {
      const task =
        tasks[0] ??
        (await addJobTask(job.id, {
          title: 'Job photos',
          description: 'Photos attached to this job.',
        }))
      uploadSessionSeq.current += 1
      setUploadSession({ kind: 'create', taskId: task.id, key: uploadSessionSeq.current })
    })()
  }

  const openEditPhoto = (photo: TaskPhoto) => {
    if (!canManage || !canManageTaskPhoto(photo, user)) return
    uploadSessionSeq.current += 1
    setUploadSession({ kind: 'edit', photo, key: uploadSessionSeq.current })
  }

  const handleDeletePhoto = (photoId: string) => {
    const photo = taskPhotos.find((p) => p.id === photoId)
    if (!photo || !canManage || !canManageTaskPhoto(photo, user)) return
    void deleteTaskPhoto(photoId)
  }

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm shadow-slate-900/[0.03] dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Photos</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-gray-400">
            {canManage
              ? 'Upload and review all job photos as the business owner or admin.'
              : 'Your uploads for this assigned job appear here.'}
          </p>
        </div>
        {canManage ? (
          <Button type="button" className="min-h-[48px] w-full sm:w-auto" onClick={openUpload}>
            Upload Photo
          </Button>
        ) : null}
      </div>

      <div className="mt-5">
        {photos.length > 0 ? (
          <TaskPhotoGrid
            photos={photos}
            onPhotoClick={setPreview}
            onEditPhoto={canManage ? openEditPhoto : undefined}
            canEdit={canManage}
          />
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/90 px-4 py-8 text-center text-[15px] text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-gray-400">
            No photos yet
          </p>
        )}
      </div>

      <TaskPhotoUploadModal
        key={
          uploadSession
            ? `${uploadSession.kind}-${
                uploadSession.kind === 'edit' ? uploadSession.photo.id : uploadSession.taskId
              }-${uploadSession.key}`
            : 'closed'
        }
        open={uploadSession !== null}
        mode={uploadSession?.kind === 'edit' ? 'edit' : 'create'}
        editingPhoto={uploadSession?.kind === 'edit' ? uploadSession.photo : null}
        initialNote={uploadSession?.kind === 'edit' ? uploadSession.photo.note : ''}
        onClose={() => setUploadSession(null)}
        onSubmit={async (input) => {
          if (!user || !canManage) {
            throw new Error('You do not have access to manage job photos.')
          }

          if (input.photoId) {
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
            return
          }

          if (uploadSession?.kind !== 'create') return
          const upload = await uploadJobPhotoFromDataUrl({
            dataUrl: input.image_url,
            fileName: input.file_name,
            jobId: job.id,
            userId: user.id,
          })
          try {
            await addTaskPhoto({
              task_id: uploadSession.taskId,
              image_url: upload.imageUrl,
              storage_path: upload.storagePath,
              label: input.label,
              note: input.note,
              uploaded_by_id: user.id,
              uploaded_by: uploadedBy,
            })
          } catch (error) {
            await deleteStoredJobPhoto(upload.storagePath).catch((cleanupError: unknown) =>
              console.error('Failed to clean up orphaned job photo', cleanupError),
            )
            throw error
          }
        }}
      />

      <TaskPhotoPreviewModal
        photo={preview}
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        onDelete={canManage ? handleDeletePhoto : undefined}
        onEdit={canManage ? (p) => openEditPhoto(p) : undefined}
      />
    </section>
  )
}
