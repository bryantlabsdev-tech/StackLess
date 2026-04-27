import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageContainer } from '../components/layout/PageContainer'
import { TaskPhotoPreviewModal } from '../components/execution/TaskPhotoPreviewModal'
import { JobStatusBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { Textarea } from '../components/ui/Textarea'
import { useAppData } from '../hooks/useAppData'
import { formatDisplayDate } from '../lib/format'
import { PHOTO_LABEL_COPY, photoLabelBadgeClass } from '../lib/taskPhotoLabels'
import type { Job, TaskPhoto } from '../types'

type ReviewJob = {
  job: Job
  photos: TaskPhoto[]
  checklistComplete: number
  checklistTotal: number
}

export function VerificationInboxPage() {
  const { jobs, jobTasks, taskPhotos, verifyJob, sendJobBack } = useAppData()
  const [preview, setPreview] = useState<TaskPhoto | null>(null)
  const [sendBackJob, setSendBackJob] = useState<Job | null>(null)
  const [feedback, setFeedback] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const reviewJobs = useMemo<ReviewJob[]>(() => {
    return jobs
      .filter((job) => job.status === 'needs_verification')
      .map((job) => {
        const tasks = jobTasks.filter((task) => task.job_id === job.id)
        const taskIds = new Set(tasks.map((task) => task.id))
        const photos = taskPhotos
          .filter((photo) => taskIds.has(photo.task_id))
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
        const checklistComplete = job.checklist.filter((item) => item.is_completed).length
        return {
          job,
          photos,
          checklistComplete,
          checklistTotal: job.checklist.length,
        }
      })
      .sort((a, b) => (a.job.work_completed_at ?? '').localeCompare(b.job.work_completed_at ?? ''))
  }, [jobTasks, jobs, taskPhotos])

  const openSendBack = (job: Job) => {
    setActionError(null)
    setFeedback('')
    setSendBackJob(job)
  }

  const approve = (jobId: string) => {
    void (async () => {
      setActionError(null)
      const result = await verifyJob(jobId)
      if (!result.ok) setActionError(result.reason ?? 'Unable to approve this job.')
    })()
  }

  const confirmSendBack = () => {
    if (!sendBackJob) return
    void (async () => {
      setActionError(null)
      const result = await sendJobBack(sendBackJob.id, feedback)
      if (!result.ok) {
        setActionError(result.reason ?? 'Unable to send this job back.')
        return
      }
      setSendBackJob(null)
      setFeedback('')
    })()
  }

  return (
    <PageContainer>
      <PageHeader
        title="Needs Verification"
        description="Review completed jobs, proof photos, checklist status, and crew notes before closing them out."
      />

      {actionError ? (
        <p className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100">
          {actionError}
        </p>
      ) : null}

      {reviewJobs.length === 0 ? (
        <EmptyState
          title="No jobs waiting for verification"
          detail="Completed crew work will appear here when it is ready for admin review."
        />
      ) : (
        <div className="space-y-5">
          {reviewJobs.map(({ job, photos, checklistComplete, checklistTotal }) => (
            <article
              key={job.id}
              className="rounded-[24px] border border-slate-200/90 bg-white p-4 shadow-sm shadow-slate-900/[0.03] dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20 sm:p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <JobStatusBadge status={job.status} />
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-gray-300">
                      {formatDisplayDate(job.date)}
                    </span>
                  </div>
                  <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-950 dark:text-white">
                    {job.title}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-slate-600 dark:text-gray-300">
                    {job.customer_name || 'No customer'} / {job.start_time || '-'}-{job.end_time || '-'}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">{job.address || 'No address'}</p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
                  <Link
                    className="inline-flex min-h-11 items-center justify-center rounded-[14px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-px hover:bg-slate-50 dark:border-[#1F2A36] dark:bg-[#151B23] dark:text-slate-100 dark:hover:border-slate-600"
                    to={`/jobs/${job.id}`}
                  >
                    Open job
                  </Link>
                  <Button type="button" onClick={() => approve(job.id)}>
                    Approve
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => openSendBack(job)}>
                    Send back
                  </Button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
                <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Photos</h3>
                  {photos.length === 0 ? (
                    <p className="mt-3 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-400">
                      No photos attached to this job.
                    </p>
                  ) : (
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                      {photos.map((photo) => (
                        <button
                          key={photo.id}
                          type="button"
                          className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-px hover:border-blue-300 dark:border-slate-700 dark:bg-slate-900"
                          onClick={() => setPreview(photo)}
                        >
                          <img
                            src={photo.image_url}
                            alt={photo.note.trim() || `${PHOTO_LABEL_COPY[photo.label]} photo`}
                            className="aspect-[4/3] w-full object-cover"
                            loading="lazy"
                          />
                          <span className="block space-y-1 px-3 py-2">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${photoLabelBadgeClass(photo.label)}`}>
                              {PHOTO_LABEL_COPY[photo.label]}
                            </span>
                            <span className="block truncate text-xs font-medium text-slate-600 dark:text-gray-300">
                              {photo.uploaded_by || 'Unknown uploader'}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </section>

                <section className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Checklist</h3>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                      {checklistComplete}/{checklistTotal}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-gray-400">items completed</p>
                    <ul className="mt-3 space-y-2">
                      {job.checklist.map((item) => (
                        <li key={item.id} className="flex gap-2 text-sm text-slate-700 dark:text-gray-300">
                          <span className={item.is_completed ? 'text-emerald-600' : 'text-amber-600'}>
                            {item.is_completed ? 'Done' : 'Open'}
                          </span>
                          <span>{item.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
                    <h3 className="text-sm font-bold text-amber-950 dark:text-amber-100">Notes</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-amber-950 dark:text-amber-50">
                      {job.notes.trim() || 'No job notes.'}
                    </p>
                  </div>
                </section>
              </div>
            </article>
          ))}
        </div>
      )}

      <TaskPhotoPreviewModal
        photo={preview}
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
      />

      {sendBackJob ? (
        <Modal
          open
          title="Send job back"
          description={`Tell the crew what needs to be fixed on ${sendBackJob.title}.`}
          onClose={() => setSendBackJob(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setSendBackJob(null)}>
                Cancel
              </Button>
              <Button onClick={confirmSendBack}>Send back to crew</Button>
            </>
          }
        >
          <Textarea
            label="Feedback for crew"
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            placeholder="Example: Missing after photo of the back patio. Please upload and resubmit."
            required
          />
        </Modal>
      ) : null}
    </PageContainer>
  )
}
