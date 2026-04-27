import { useEffect, useMemo, useState } from 'react'
import { useAppData } from '../../hooks/useAppData'
import { useAuth } from '../../hooks/useAuth'
import { buildNewJob, defaultTaskIdForJob } from '../../lib/jobDefaults'
import { formatDisplayDate } from '../../lib/format'
import { deleteStoredJobPhoto, uploadJobPhotoBlob } from '../../lib/jobPhotoStorage'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { JobForm } from './JobForm'
import type { PendingJobPhoto } from './CreateJobPhotosSection'
import type { Job } from '../../types'

export function JobModal({
  open,
  onClose,
  jobId,
  initialDate,
  initialAssigneeId,
  newJobTitle,
  newJobDescription,
}: {
  open: boolean
  onClose: () => void
  jobId: string | null
  initialDate?: string
  initialAssigneeId?: string | null
  /** When creating (no jobId), overrides default “New job” copy — e.g. calendar quick add. */
  newJobTitle?: string
  newJobDescription?: string
}) {
  const { customers, employees, addJob, updateJob, getJob, addTaskPhoto } = useAppData()
  const { user } = useAuth()
  const job = jobId ? getJob(jobId) : undefined
  const [saveWarning, setSaveWarning] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => setSaveWarning(null), 0)
    return () => window.clearTimeout(timer)
  }, [open, jobId])

  const initial: Omit<Job, 'id'> = useMemo(() => {
    if (job) {
      const { id, ...rest } = job
      void id
      return rest
    }
    const base = buildNewJob(customers, initialDate)
    if (initialAssigneeId) {
      return {
        ...base,
        assignees: [initialAssigneeId],
        status: 'scheduled',
      }
    }
    return base
  }, [job, customers, initialDate, initialAssigneeId])

  const formKey = jobId ?? `new-${initialDate ?? 'x'}-${initialAssigneeId ?? 'na'}`

  const scheduleDateLabel =
    !jobId && initialDate ? formatDisplayDate(initialDate) : undefined

  const canAttachPhotosOnCreate = !jobId && user?.role === 'admin'

  const uploadPendingPhotos = async (createdJob: Job, pendingPhotos: PendingJobPhoto[]) => {
    if (pendingPhotos.length === 0) return true
    if (!user || user.role !== 'admin') return false

    const taskId = defaultTaskIdForJob(createdJob.id)
    const uploadedBy = user.full_name?.trim() || 'StackLess user'
    const results = await Promise.allSettled(
      pendingPhotos.map(async (photo) => {
        const upload = await uploadJobPhotoBlob({
          blob: photo.file,
          fileName: photo.file.name,
          jobId: createdJob.id,
          userId: user.id,
        })

        try {
          await addTaskPhoto({
            task_id: taskId,
            image_url: upload.imageUrl,
            storage_path: upload.storagePath,
            label: 'reference',
            note: '',
            uploaded_by_id: user.id,
            uploaded_by: uploadedBy,
          })
        } catch (error) {
          await deleteStoredJobPhoto(upload.storagePath).catch((cleanupError) =>
            console.error('Failed to clean up orphaned job photo', cleanupError),
          )
          throw error
        }
      }),
    )

    return results.every((result) => result.status === 'fulfilled')
  }

  return (
    <Modal
      open={open}
      title={jobId ? 'Edit job' : (newJobTitle ?? 'New job')}
      description={
        jobId
          ? 'Update timing, crew, details, or status — changes show on the schedule immediately.'
          : (newJobDescription ??
            'Pick a customer (or add a new one), set the time window, assign crew, and save. You can fine-tune details anytime.')
      }
      onClose={onClose}
      wide
    >
      {saveWarning ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
            <p className="font-semibold">{saveWarning}</p>
            <p className="mt-1 leading-relaxed">
              The job is available in Jobs and can still have photos added from job details.
            </p>
          </div>
          <div className="flex justify-end">
            <Button type="button" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : (
        <>
      {!jobId && scheduleDateLabel ? (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-3.5 py-2.5 text-sm dark:border-emerald-800/60 dark:bg-emerald-950/40">
          <span className="font-medium text-emerald-900 dark:text-emerald-200">Scheduled for</span>
          <span className="font-semibold tabular-nums text-emerald-950 dark:text-white">
            {scheduleDateLabel}
          </span>
        </div>
      ) : null}
      <JobForm
        key={formKey}
        customers={customers}
        employees={employees}
        initial={initial}
        scheduleDateLabel={scheduleDateLabel}
        submitLabel={jobId ? 'Save changes' : 'Create job'}
        showCreatePhotos={canAttachPhotosOnCreate}
        onCancel={onClose}
        onSubmit={async (values, pendingPhotos) => {
          if (jobId) {
            await updateJob(jobId, values)
            onClose()
            return
          }

          const createdJob = await addJob(values)
          const ok = await uploadPendingPhotos(createdJob, pendingPhotos)
          if (!ok) {
            setSaveWarning('Job saved, but some photos failed to upload.')
            return
          }
          onClose()
        }}
      />
        </>
      )}
    </Modal>
  )
}
