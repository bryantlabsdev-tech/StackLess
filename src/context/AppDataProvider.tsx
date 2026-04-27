import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { ensureJobExecutionFields } from '../lib/ensureJob'
import { migrateAssigneeIdsFromUnknown, stripLegacyAssignFields } from '../lib/jobAssignees'
import { createSignedJobPhotoUrl, deleteStoredJobPhoto } from '../lib/jobPhotoStorage'
import { defaultTaskIdForJob } from '../lib/jobDefaults'
import { normalizeJobTask } from '../lib/normalizeJobTask'
import { supabase } from '../lib/supabase'
import type { PhotoLabelId } from '../lib/taskPhotoLabels'
import { normalizeTaskPhoto } from '../lib/taskPhotoUtils'
import { canMarkJobComplete } from '../lib/jobCompletion'
import { AppDataContext, type AppDataContextValue } from './appDataContext'
import { useAuth } from '../hooks/useAuth'
import { useFeedback } from '../hooks/useFeedback'
import type {
  Customer,
  Employee,
  EmployeeDaySchedule,
  EmployeeInvite,
  Job,
  JobStatus,
  JobTask,
  TaskPhoto,
} from '../types'

function newId(): string {
  return crypto.randomUUID()
}

function normalizeJob(job: Job, customers: Customer[]): Job {
  const c = customers.find((x) => x.id === job.customer_id)
  const assignees = [...new Set(migrateAssigneeIdsFromUnknown(job))]

  let status: JobStatus = job.status
  if (
    assignees.length === 0 &&
    status !== 'canceled' &&
    status !== 'completed' &&
    status !== 'needs_verification' &&
    status !== 'verified'
  ) {
    status = 'unassigned'
  }
  if (assignees.length > 0 && status === 'unassigned') {
    status = 'scheduled'
  }

  const merged = stripLegacyAssignFields({
    ...(job as unknown as Record<string, unknown>),
    customer_name: c?.full_name ?? job.customer_name,
    address: c?.address ?? job.address,
    assignees,
    status,
  }) as Job

  return ensureJobExecutionFields(merged)
}

function logDataError(action: string, error: unknown) {
  console.error(`Failed to ${action}`, error)
}

const ASSIGNMENT_FAILED_MESSAGE = 'Assignment failed, please retry'

class AssignmentPersistError extends Error {
  readonly feedbackTitle = ASSIGNMENT_FAILED_MESSAGE
  readonly originalError: unknown

  constructor(originalError: unknown) {
    super(ASSIGNMENT_FAILED_MESSAGE)
    this.name = 'AssignmentPersistError'
    this.originalError = originalError
  }
}

function requireOrgId(orgId: string | null): string {
  if (!orgId) throw new Error('No organization is available for this account.')
  return orgId
}

function requireUserId(userId: string | null): string {
  if (!userId) throw new Error('No authenticated user is available.')
  return userId
}

type DbCustomer = {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
}

type DbEmployee = {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  role: string | null
  availability: string | null
  status: Employee['status'] | null
  notes: string | null
}

type DbEmployeeInvite = {
  id: string
  organization_id: string
  employee_id: string
  token: string
  contact_email: string | null
  contact_phone: string | null
  status: EmployeeInvite['status']
  invited_by: string | null
  accepted_by: string | null
  accepted_at: string | null
  expires_at: string | null
  created_at: string
}

type DbJob = {
  id: string
  title: string
  customer_id: string | null
  customer_name: string | null
  service_type: string | null
  address: string | null
  job_value: number | string | null
  date: string
  start_time: string | null
  end_time: string | null
  status: JobStatus
  notes: string | null
  requires_photos: boolean | null
  work_started_at: string | null
  work_completed_at: string | null
  verification_feedback: string | null
}

type DbJobAssignee = {
  job_id: string
  employee_id: string
}

type DbChecklistItem = {
  id: string
  job_id: string
  title: string
  is_completed: boolean
  order_index: number
}

type DbTask = {
  id: string
  job_id: string
  title: string
  description: string | null
  is_completed: boolean
}

type DbTaskPhoto = {
  id: string
  task_id: string
  image_url: string
  storage_path: string | null
  label: PhotoLabelId
  note: string | null
  uploaded_by_id: string | null
  uploaded_by: string | null
  created_at: string
  updated_at: string | null
}

type DbEmployeeDaySchedule = {
  id: string
  employee_id: string
  date: string
  status: EmployeeDaySchedule['status']
  start_time: string | null
  end_time: string | null
  notes: string | null
}

async function loadOperationalData(organizationId: string) {
  const [
    customersResult,
    employeesResult,
    invitesResult,
    jobsResult,
    assigneesResult,
    tasksResult,
    checklistResult,
    photosResult,
    daySchedulesResult,
  ] = await Promise.all([
    supabase.from('customers').select('*').eq('organization_id', organizationId).order('full_name'),
    supabase.from('employees').select('*').eq('organization_id', organizationId).order('full_name'),
    supabase.from('employee_invites').select('*').eq('organization_id', organizationId),
    supabase.from('jobs').select('*').eq('organization_id', organizationId).order('date'),
    supabase.from('job_assignees').select('*').eq('organization_id', organizationId),
    supabase.from('job_tasks').select('*').eq('organization_id', organizationId),
    supabase
      .from('job_checklist_items')
      .select('*')
      .eq('organization_id', organizationId)
      .order('order_index'),
    supabase.from('task_photos').select('*').eq('organization_id', organizationId),
    supabase.from('employee_day_schedules').select('*').eq('organization_id', organizationId),
  ])

  const results = [
    customersResult,
    employeesResult,
    invitesResult,
    jobsResult,
    assigneesResult,
    tasksResult,
    checklistResult,
    photosResult,
    daySchedulesResult,
  ]
  const failed = results.find((result) => result.error)
  if (failed?.error) throw failed.error

  const customers = ((customersResult.data ?? []) as DbCustomer[]).map((c): Customer => ({
    id: c.id,
    full_name: c.full_name,
    phone: c.phone ?? '',
    email: c.email ?? '',
    address: c.address ?? '',
    notes: c.notes ?? '',
  }))

  const employees = ((employeesResult.data ?? []) as DbEmployee[]).map((e): Employee => ({
    id: e.id,
    full_name: e.full_name,
    phone: e.phone ?? '',
    email: e.email ?? '',
    role: e.role ?? '',
    availability: e.availability ?? '',
    status: e.status ?? 'active',
    notes: e.notes ?? '',
  }))

  const employeeInvites = ((invitesResult.data ?? []) as DbEmployeeInvite[]).map(
    (invite): EmployeeInvite => ({
      id: invite.id,
      organization_id: invite.organization_id,
      employee_id: invite.employee_id,
      token: invite.token,
      contact_email: invite.contact_email,
      contact_phone: invite.contact_phone,
      status: invite.status,
      invited_by: invite.invited_by,
      accepted_by: invite.accepted_by,
      accepted_at: invite.accepted_at,
      expires_at: invite.expires_at,
      created_at: invite.created_at,
    }),
  )

  const assigneesByJob = new Map<string, string[]>()
  for (const row of (assigneesResult.data ?? []) as DbJobAssignee[]) {
    const list = assigneesByJob.get(row.job_id) ?? []
    list.push(row.employee_id)
    assigneesByJob.set(row.job_id, list)
  }

  const checklistByJob = new Map<string, DbChecklistItem[]>()
  for (const row of (checklistResult.data ?? []) as DbChecklistItem[]) {
    const list = checklistByJob.get(row.job_id) ?? []
    list.push(row)
    checklistByJob.set(row.job_id, list)
  }

  const jobs = ((jobsResult.data ?? []) as DbJob[]).map((j): Job => {
    const checklist = (checklistByJob.get(j.id) ?? []).map((item) => ({
      id: item.id,
      job_id: item.job_id,
      title: item.title,
      is_completed: item.is_completed,
      order_index: item.order_index,
    }))
    return normalizeJob(
      {
        id: j.id,
        title: j.title,
        customer_id: j.customer_id ?? '',
        customer_name: j.customer_name ?? '',
        service_type: j.service_type ?? '',
        address: j.address ?? '',
        job_value: typeof j.job_value === 'number' ? j.job_value : j.job_value ? Number(j.job_value) : null,
        date: j.date,
        start_time: j.start_time ?? '',
        end_time: j.end_time ?? '',
        assignees: assigneesByJob.get(j.id) ?? [],
        status: j.status,
        notes: j.notes ?? '',
        requires_photos: j.requires_photos ?? true,
        checklist,
        work_started_at: j.work_started_at,
        work_completed_at: j.work_completed_at,
        verification_feedback: j.verification_feedback ?? '',
      },
      customers,
    )
  })

  const jobTasks = ((tasksResult.data ?? []) as DbTask[]).map((t) =>
    normalizeJobTask({
      id: t.id,
      job_id: t.job_id,
      title: t.title,
      description: t.description ?? '',
      is_completed: t.is_completed,
    }),
  )

  const taskPhotos = ((photosResult.data ?? []) as DbTaskPhoto[]).map((p) =>
    normalizeTaskPhoto({
      id: p.id,
      task_id: p.task_id,
      image_url: p.image_url,
      storage_path: p.storage_path,
      label: p.label,
      note: p.note ?? '',
      uploaded_by_id: p.uploaded_by_id,
      uploaded_by: p.uploaded_by ?? '',
      created_at: p.created_at,
      updated_at: p.updated_at,
    }),
  )

  const employeeDaySchedules = ((daySchedulesResult.data ?? []) as DbEmployeeDaySchedule[]).map(
    (r): EmployeeDaySchedule => ({
      id: r.id,
      employee_id: r.employee_id,
      date: r.date,
      status: r.status,
      start_time: r.start_time,
      end_time: r.end_time,
      notes: r.notes,
    }),
  )

  return { customers, employees, employeeInvites, jobs, jobTasks, taskPhotos, employeeDaySchedules }
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user, isReady } = useAuth()
  const { notify, trackSync } = useFeedback()
  const organizationId = user?.organization_id ?? null
  const userId = user?.id ?? null
  const [customers, setCustomers] = useState<Customer[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [employeeInvites, setEmployeeInvites] = useState<EmployeeInvite[]>([])
  const [jobTasks, setJobTasks] = useState<JobTask[]>([])
  const [taskPhotos, setTaskPhotos] = useState<TaskPhoto[]>([])
  const [employeeDaySchedules, setEmployeeDaySchedules] = useState<EmployeeDaySchedule[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const refreshedPhotoPaths = useRef(new Set<string>())
  const syncedDefaultTaskIds = useRef(new Set<string>())

  const refreshWorkspaceStateFromDb = useCallback(async () => {
    if (!organizationId || !user || user.auth_mode === 'development') return
    try {
      const data = await loadOperationalData(organizationId)
      setCustomers(data.customers)
      setJobs(data.jobs)
      setEmployees(data.employees)
      setEmployeeInvites(data.employeeInvites)
      setJobTasks(data.jobTasks)
      setTaskPhotos(data.taskPhotos)
      setEmployeeDaySchedules(data.employeeDaySchedules)
      refreshedPhotoPaths.current.clear()
      syncedDefaultTaskIds.current.clear()
    } catch (error) {
      logDataError('refresh workspace state', error)
      notify({
        tone: 'error',
        title: 'Could not refresh workspace data',
        detail: error instanceof Error ? error.message : 'Refresh and try again.',
      })
    }
  }, [notify, organizationId, user])

  /* eslint-disable react-hooks/set-state-in-effect -- hydrate the app data context from Supabase auth/org scope */
  useEffect(() => {
    let active = true

    if (!isReady) return undefined
    if (!user || !organizationId || user.auth_mode === 'development') {
      setIsLoading(false)
      setCustomers([])
      setJobs([])
      setEmployees([])
      setEmployeeInvites([])
      setJobTasks([])
      setTaskPhotos([])
      setEmployeeDaySchedules([])
      return undefined
    }

    setIsLoading(true)
    void loadOperationalData(organizationId)
      .then((data) => {
        if (!active) return
        setCustomers(data.customers)
        setJobs(data.jobs)
        setEmployees(data.employees)
        setEmployeeInvites(data.employeeInvites)
        setJobTasks(data.jobTasks)
        setTaskPhotos(data.taskPhotos)
        setEmployeeDaySchedules(data.employeeDaySchedules)
        refreshedPhotoPaths.current.clear()
        syncedDefaultTaskIds.current.clear()
        notify({ tone: 'success', title: 'Workspace synced' })
      })
      .catch((error) => {
        logDataError('load operational data', error)
        if (!active) return
        setCustomers([])
        setJobs([])
        setEmployees([])
        setEmployeeInvites([])
        setJobTasks([])
        setTaskPhotos([])
        setEmployeeDaySchedules([])
        notify({
          tone: 'error',
          title: 'Could not load workspace data',
          detail: error instanceof Error ? error.message : 'Refresh and try again.',
        })
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [isReady, notify, organizationId, user])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    let active = true
    const paths = taskPhotos
      .map((p) => p.storage_path)
      .filter(
        (path): path is string =>
          typeof path === 'string' && !refreshedPhotoPaths.current.has(path),
      )

    if (paths.length === 0) return undefined

    void Promise.all(
      [...new Set(paths)].map(async (path) => [path, await createSignedJobPhotoUrl(path)] as const),
    )
      .then((entries) => {
        if (!active) return
        const signedUrlByPath = new Map(entries)
        for (const [path] of entries) refreshedPhotoPaths.current.add(path)
        setTaskPhotos((prev) =>
          prev.map((p) => {
            if (!p.storage_path) return p
            const signedUrl = signedUrlByPath.get(p.storage_path)
            return signedUrl && signedUrl !== p.image_url ? { ...p, image_url: signedUrl } : p
          }),
        )
      })
      .catch((error) => {
        console.error('Failed to refresh signed photo URLs', error)
      })

    return () => {
      active = false
    }
  }, [taskPhotos])

  /**
   * Photos attach to tasks. Older data may have jobs with zero tasks —
   * add one default step so Job Details always has an "Add photo" target.
   */
  /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration migration from jobs → tasks */
  useEffect(() => {
    setJobTasks((prev) => {
      const countByJob = new Map<string, number>()
      for (const t of prev) {
        countByJob.set(t.job_id, (countByJob.get(t.job_id) ?? 0) + 1)
      }
      const additions: JobTask[] = []
      for (const job of jobs) {
        if ((countByJob.get(job.id) ?? 0) > 0) continue
        additions.push(
          normalizeJobTask({
            id: defaultTaskIdForJob(job.id),
            job_id: job.id,
            title: 'Complete visit',
            description:
              job.notes?.trim() ||
              'Follow the job instructions. Add photos here to document the work.',
            is_completed: false,
          }),
        )
      }
      if (additions.length === 0) return prev
      return [...prev, ...additions]
    })
  }, [jobs])
  /* eslint-enable react-hooks/set-state-in-effect */

  const persistCustomer = useCallback(
    async (customer: Customer) => {
      const orgId = requireOrgId(organizationId)
      const actorId = requireUserId(userId)
      const { error } = await supabase.from('customers').upsert({
        id: customer.id,
        organization_id: orgId,
        full_name: customer.full_name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        notes: customer.notes,
        updated_by: actorId,
        created_by: actorId,
      })
      if (error) throw error
    },
    [organizationId, userId],
  )

  const persistEmployee = useCallback(
    async (employee: Employee) => {
      const orgId = requireOrgId(organizationId)
      const actorId = requireUserId(userId)
      const { error } = await supabase.from('employees').upsert({
        id: employee.id,
        organization_id: orgId,
        full_name: employee.full_name,
        phone: employee.phone,
        email: employee.email,
        role: employee.role,
        availability: employee.availability,
        status: employee.status,
        notes: employee.notes,
        updated_by: actorId,
        created_by: actorId,
      })
      if (error) throw error
    },
    [organizationId, userId],
  )

  const persistJob = useCallback(
    async (job: Job) => {
      const orgId = requireOrgId(organizationId)
      requireUserId(userId)
      const assigneeIds = [...new Set(job.assignees)]
      const checklistPayload = job.checklist.map((item) => ({
        id: item.id,
        title: item.title,
        is_completed: item.is_completed,
        order_index: item.order_index,
      }))

      const { data, error } = await supabase.rpc('save_job_atomic', {
        job_payload: {
          id: job.id,
          organization_id: orgId,
          customer_id: job.customer_id || null,
          title: job.title,
          customer_name: job.customer_name,
          service_type: job.service_type,
          address: job.address,
          job_value: job.job_value,
          date: job.date,
          start_time: job.start_time,
          end_time: job.end_time,
          status: job.status,
          notes: job.notes,
          requires_photos: job.requires_photos,
          work_started_at: job.work_started_at,
          work_completed_at: job.work_completed_at,
          verification_feedback: job.verification_feedback,
        },
        assignee_ids: assigneeIds,
        checklist_payload: checklistPayload,
      })
      if (error) throw error

      const result = data as { success?: boolean; error?: string } | null
      if (!result?.success) {
        const message =
          typeof result?.error === 'string' && result.error.trim() !== ''
            ? result.error
            : 'Could not save job'
        if (message.toLowerCase().includes('assignee')) {
          throw new AssignmentPersistError(new Error(message))
        }
        throw new Error(message)
      }
    },
    [organizationId, userId],
  )

  const persistJobWorkState = useCallback(
    async (
      job: Pick<
        Job,
        'id' | 'status' | 'work_started_at' | 'work_completed_at' | 'verification_feedback'
      >,
    ) => {
      const { error } = await supabase
        .from('jobs')
        .update({
          status: job.status,
          work_started_at: job.work_started_at,
          work_completed_at: job.work_completed_at,
          verification_feedback: job.verification_feedback,
          updated_by: requireUserId(userId),
        })
        .eq('id', job.id)
        .eq('organization_id', requireOrgId(organizationId))
      if (error) throw error
    },
    [organizationId, userId],
  )

  const persistJobTask = useCallback(
    async (task: JobTask) => {
      const orgId = requireOrgId(organizationId)
      const actorId = requireUserId(userId)
      const { error } = await supabase.from('job_tasks').upsert({
        id: task.id,
        organization_id: orgId,
        job_id: task.job_id,
        title: task.title,
        description: task.description,
        is_completed: task.is_completed,
        updated_by: actorId,
        created_by: actorId,
      })
      if (error) throw error
    },
    [organizationId, userId],
  )

  useEffect(() => {
    if (!organizationId || !userId) return
    for (const task of jobTasks) {
      if (task.id !== defaultTaskIdForJob(task.job_id)) continue
      if (syncedDefaultTaskIds.current.has(task.id)) continue
      syncedDefaultTaskIds.current.add(task.id)
      void persistJobTask(task).catch((error) => logDataError('save default task', error))
    }
  }, [jobTasks, organizationId, persistJobTask, userId])

  const persistTaskPhoto = useCallback(
    async (photo: TaskPhoto) => {
      const orgId = requireOrgId(organizationId)
      const { error } = await supabase.from('task_photos').upsert({
        id: photo.id,
        organization_id: orgId,
        task_id: photo.task_id,
        image_url: photo.image_url,
        storage_path: photo.storage_path ?? null,
        label: photo.label,
        note: photo.note,
        uploaded_by_id: photo.uploaded_by_id ?? userId,
        uploaded_by: photo.uploaded_by,
        created_at: photo.created_at,
        updated_at: photo.updated_at,
      })
      if (error) throw error
    },
    [organizationId, userId],
  )

  const persistChecklistItem = useCallback(
    async (item: Job['checklist'][number]) => {
      const orgId = requireOrgId(organizationId)
      const actorId = requireUserId(userId)
      const { error } = await supabase.from('job_checklist_items').upsert({
        id: item.id,
        organization_id: orgId,
        job_id: item.job_id,
        title: item.title,
        is_completed: item.is_completed,
        order_index: item.order_index,
        updated_by: actorId,
        created_by: actorId,
      })
      if (error) throw error
    },
    [organizationId, userId],
  )

  const addCustomer = useCallback((input: Omit<Customer, 'id'>) => {
    const c: Customer = { ...input, id: newId() }
    setCustomers((prev) => [...prev, c])
    void trackSync(persistCustomer(c), {
      success: 'Customer saved',
      error: 'Could not save customer',
    }).catch((error) => logDataError('save customer', error))
    return c
  }, [persistCustomer, trackSync])

  const updateCustomer = useCallback(
    (id: string, patch: Partial<Customer>) => {
      setCustomers((prevC) => {
        const nextC = prevC.map((c) => (c.id === id ? { ...c, ...patch } : c))
        const updated = nextC.find((c) => c.id === id)
        if (updated) {
          void trackSync(persistCustomer(updated), {
            success: 'Customer changes saved',
            error: 'Could not save customer changes',
          }).catch((error) => logDataError('update customer', error))
        }
        setJobs((prevJ) =>
          prevJ.map((j) => {
            if (j.customer_id !== id) return j
            const updatedJob = normalizeJob({ ...j, customer_id: id } as Job, nextC)
            void persistJob(updatedJob).catch((error) =>
              logDataError('sync customer job details', error),
            )
            return updatedJob
          }),
        )
        return nextC
      })
    },
    [persistCustomer, persistJob, trackSync],
  )

  const getCustomer = useCallback(
    (id: string) => customers.find((c) => c.id === id),
    [customers],
  )

  const addEmployee = useCallback((input: Omit<Employee, 'id'>) => {
    const e: Employee = { ...input, id: newId() }
    setEmployees((prev) => [...prev, e])
    void trackSync(persistEmployee(e), {
      success: 'Employee saved',
      error: 'Could not save employee',
    }).catch((error) => logDataError('save employee', error))
    return e
  }, [persistEmployee, trackSync])

  const updateEmployee = useCallback(
    (id: string, patch: Partial<Employee>) => {
      setEmployees((prevE) => {
        const nextE = prevE.map((e) => (e.id === id ? { ...e, ...patch } : e))
        const updated = nextE.find((e) => e.id === id)
        if (updated) {
          void trackSync(persistEmployee(updated), {
            success: 'Employee changes saved',
            error: 'Could not save employee changes',
          }).catch((error) => logDataError('update employee', error))
        }
        setJobs((prevJ) =>
          prevJ.map((j) =>
            j.assignees.includes(id) ? normalizeJob({ ...j } as Job, customers) : j,
          ),
        )
        return nextE
      })
    },
    [customers, persistEmployee, trackSync],
  )

  const getEmployee = useCallback(
    (id: string) => employees.find((e) => e.id === id),
    [employees],
  )

  const createEmployeeInvite = useCallback(
    async (
      employeeId: string,
      input: { contact_email?: string; contact_phone?: string },
    ): Promise<EmployeeInvite> => {
      const orgId = requireOrgId(organizationId)
      const actorId = requireUserId(userId)
      const token = crypto.randomUUID().replaceAll('-', '')
      const row = {
        organization_id: orgId,
        employee_id: employeeId,
        token,
        contact_email: input.contact_email?.trim().toLowerCase() || null,
        contact_phone: input.contact_phone?.trim() || null,
        status: 'pending',
        invited_by: actorId,
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
      }
      const { data, error } = await supabase
        .from('employee_invites')
        .insert(row)
        .select('*')
        .single()
      if (error) throw error
      const invite = data as DbEmployeeInvite
      const normalized: EmployeeInvite = {
        id: invite.id,
        organization_id: invite.organization_id,
        employee_id: invite.employee_id,
        token: invite.token,
        contact_email: invite.contact_email,
        contact_phone: invite.contact_phone,
        status: invite.status,
        invited_by: invite.invited_by,
        accepted_by: invite.accepted_by,
        accepted_at: invite.accepted_at,
        expires_at: invite.expires_at,
        created_at: invite.created_at,
      }
      setEmployeeInvites((prev) => [normalized, ...prev])
      return normalized
    },
    [organizationId, userId],
  )

  const updateJob = useCallback(
    async (id: string, patch: Partial<Job>) => {
      const current = jobs.find((x) => x.id === id)
      if (!current) return
      let merged = normalizeJob({ ...current, ...patch } as Job, customers)

      if (
        patch.status === 'completed' ||
        patch.status === 'needs_verification' ||
        patch.status === 'verified'
      ) {
        const tasks = jobTasks.filter((t) => t.job_id === id)
        const photos = taskPhotos.filter((photo) => tasks.some((task) => task.id === photo.task_id))
        const { ok } = canMarkJobComplete(merged.checklist, tasks, photos, {
          requiresPhotos: merged.requires_photos,
        })
        if (!ok) {
          merged = { ...merged, status: current.status }
        }
      }

      try {
        await trackSync(persistJob(merged), {
          success: 'Job changes saved',
          error: 'Could not save job changes',
        })
        setJobs((prev) => prev.map((x) => (x.id === id ? merged : x)))
      } catch (error) {
        logDataError('update job', error)
        await refreshWorkspaceStateFromDb()
      }
    },
    [customers, jobTasks, jobs, persistJob, refreshWorkspaceStateFromDb, taskPhotos, trackSync],
  )

  const addJob = useCallback(
    async (input: Omit<Job, 'id'>): Promise<Job> => {
      const j = normalizeJob({ ...input, id: newId() }, customers)
      const task: JobTask = {
        id: defaultTaskIdForJob(j.id),
        job_id: j.id,
        title: 'Complete visit',
        description:
          j.notes?.trim() ||
          'Follow the work instructions above. Add more tasks if this job has multiple steps.',
        is_completed: false,
      }
      try {
        await trackSync(persistJob(j).then(() => persistJobTask(task)), {
          success: 'Job saved',
          error: 'Could not save job',
        })
        setJobs((prev) => [...prev, j])
        setJobTasks((prev) => [...prev, task])
        return j
      } catch (error) {
        logDataError('save job', error)
        await refreshWorkspaceStateFromDb()
        throw error instanceof Error ? error : new Error('Could not save job')
      }
    },
    [customers, persistJob, persistJobTask, refreshWorkspaceStateFromDb, trackSync],
  )

  const deleteJob = useCallback(
    async (id: string) => {
      const taskIds = jobTasks.filter((t) => t.job_id === id).map((t) => t.id)
      const paths = taskPhotos
        .filter((p) => taskIds.includes(p.task_id) && p.storage_path)
        .map((p) => p.storage_path as string)
      try {
        for (const path of paths) {
          await deleteStoredJobPhoto(path).catch((err) => logDataError('delete job photo storage', err))
        }
        const { error } = await supabase.from('jobs').delete().eq('id', id)
        if (error) throw error
        setJobs((prev) => prev.filter((x) => x.id !== id))
        setJobTasks((prev) => prev.filter((t) => t.job_id !== id))
        setTaskPhotos((prev) => prev.filter((p) => !taskIds.includes(p.task_id)))
      } catch (error) {
        logDataError('delete job', error)
        await refreshWorkspaceStateFromDb()
      }
    },
    [jobTasks, taskPhotos, refreshWorkspaceStateFromDb],
  )

  const getJob = useCallback(
    (id: string) => jobs.find((j) => j.id === id),
    [jobs],
  )

  const getTasksForJob = useCallback(
    (jobId: string) => jobTasks.filter((t) => t.job_id === jobId),
    [jobTasks],
  )

  const addJobTask = useCallback(
    async (jobId: string, input: { title: string; description: string }): Promise<JobTask> => {
      const row: JobTask = {
        id: newId(),
        job_id: jobId,
        title: input.title.trim() || 'Task',
        description: input.description.trim(),
        is_completed: false,
      }
      try {
        await trackSync(persistJobTask(row), {
          success: 'Task saved',
          error: 'Could not save task',
        })
        setJobTasks((prev) => [...prev, row])
        return row
      } catch (error) {
        logDataError('save task', error)
        await refreshWorkspaceStateFromDb()
        throw error instanceof Error ? error : new Error('Could not save task')
      }
    },
    [persistJobTask, refreshWorkspaceStateFromDb, trackSync],
  )

  const updateJobTask = useCallback(
    async (taskId: string, patch: Partial<Pick<JobTask, 'title' | 'description' | 'is_completed'>>) => {
      const current = jobTasks.find((t) => t.id === taskId)
      if (!current) return
      const updated = { ...current, ...patch }
      try {
        await trackSync(persistJobTask(updated), { error: 'Could not save task' })
        setJobTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)))
      } catch (error) {
        logDataError('update task', error)
        await refreshWorkspaceStateFromDb()
      }
    },
    [jobTasks, persistJobTask, refreshWorkspaceStateFromDb, trackSync],
  )

  const getPhotosForTask = useCallback(
    (taskId: string) => taskPhotos.filter((p) => p.task_id === taskId),
    [taskPhotos],
  )

  const addTaskPhoto = useCallback(
    async (input: {
      task_id: string
      image_url: string
      storage_path?: string | null
      label: PhotoLabelId
      note: string
      uploaded_by_id?: string | null
      uploaded_by: string
    }) => {
      const row: TaskPhoto = {
        ...input,
        id: newId(),
        created_at: new Date().toISOString(),
        updated_at: null,
      }
      await trackSync(persistTaskPhoto(row), {
        success: 'Photo saved',
        error: 'Photo uploaded, but metadata did not sync',
      })
      setTaskPhotos((prev) => [...prev, row])
      return row
    },
    [persistTaskPhoto, trackSync],
  )

  const updateTaskPhoto = useCallback(
    async (
      id: string,
      patch: Partial<Pick<TaskPhoto, 'image_url' | 'storage_path' | 'label' | 'note'>>,
    ) => {
      const cur = taskPhotos.find((p) => p.id === id)
      if (!cur) return
      const merged = normalizeTaskPhoto({
        ...cur,
        ...patch,
        updated_at: new Date().toISOString(),
      })
      await trackSync(persistTaskPhoto(merged), {
        success: 'Photo changes saved',
        error: 'Could not save photo changes',
      })
      setTaskPhotos((prev) => prev.map((p) => (p.id === id ? merged : p)))
    },
    [persistTaskPhoto, taskPhotos, trackSync],
  )

  const deleteTaskPhoto = useCallback(
    async (id: string) => {
      const photo = taskPhotos.find((p) => p.id === id)
      if (!photo) return
      try {
        await trackSync(
          (async () => {
            const { error } = await supabase.from('task_photos').delete().eq('id', id)
            if (error) throw error
            if (photo.storage_path) {
              await deleteStoredJobPhoto(photo.storage_path).catch((err) =>
                logDataError('delete photo storage', err),
              )
            }
          })(),
          { error: 'Could not delete photo' },
        )
        setTaskPhotos((prev) => prev.filter((p) => p.id !== id))
      } catch (error) {
        logDataError('delete photo metadata', error)
        await refreshWorkspaceStateFromDb()
      }
    },
    [taskPhotos, trackSync, refreshWorkspaceStateFromDb],
  )

  const updateChecklistItem = useCallback(
    async (jobId: string, itemId: string, is_completed: boolean) => {
      const job = jobs.find((j) => j.id === jobId)
      if (!job) return
      const checklist = job.checklist.map((c) => (c.id === itemId ? { ...c, is_completed } : c))
      const updatedItem = checklist.find((c) => c.id === itemId)
      if (!updatedItem) return
      const merged = normalizeJob({ ...job, checklist }, customers)
      try {
        await trackSync(persistChecklistItem(updatedItem), { error: 'Could not save checklist' })
        setJobs((prev) => prev.map((j) => (j.id === jobId ? merged : j)))
      } catch (error) {
        logDataError('update checklist item', error)
        await refreshWorkspaceStateFromDb()
      }
    },
    [customers, jobs, persistChecklistItem, trackSync, refreshWorkspaceStateFromDb],
  )

  const addChecklistItem = useCallback(
    async (jobId: string, title: string) => {
      const trimmed = title.trim()
      if (!trimmed) return
      const job = jobs.find((j) => j.id === jobId)
      if (!job) return
      const maxOrder = job.checklist.reduce((m, c) => Math.max(m, c.order_index), -1)
      const row = {
        id: newId(),
        job_id: jobId,
        title: trimmed,
        is_completed: false,
        order_index: maxOrder + 1,
      }
      const merged = normalizeJob({ ...job, checklist: [...job.checklist, row] }, customers)
      try {
        await trackSync(persistChecklistItem(row), { error: 'Could not save checklist' })
        setJobs((prev) => prev.map((j) => (j.id === jobId ? merged : j)))
      } catch (error) {
        logDataError('save checklist item', error)
        await refreshWorkspaceStateFromDb()
      }
    },
    [customers, jobs, persistChecklistItem, trackSync, refreshWorkspaceStateFromDb],
  )

  const updateChecklistItemTitle = useCallback(
    async (jobId: string, itemId: string, title: string) => {
      const trimmed = title.trim()
      if (!trimmed) return
      const job = jobs.find((j) => j.id === jobId)
      if (!job) return
      const checklist = job.checklist.map((c) => (c.id === itemId ? { ...c, title: trimmed } : c))
      const updatedItem = checklist.find((c) => c.id === itemId)
      if (!updatedItem) return
      const merged = normalizeJob({ ...job, checklist }, customers)
      try {
        await trackSync(persistChecklistItem(updatedItem), { error: 'Could not save checklist' })
        setJobs((prev) => prev.map((j) => (j.id === jobId ? merged : j)))
      } catch (error) {
        logDataError('update checklist item', error)
        await refreshWorkspaceStateFromDb()
      }
    },
    [customers, jobs, persistChecklistItem, trackSync, refreshWorkspaceStateFromDb],
  )

  const deleteChecklistItem = useCallback(
    async (jobId: string, itemId: string) => {
      const j = jobs.find((x) => x.id === jobId)
      if (!j || j.checklist.length <= 1) return
      const filtered = j.checklist.filter((c) => c.id !== itemId)
      const checklist = filtered
        .sort((a, b) => a.order_index - b.order_index)
        .map((c, i) => ({ ...c, order_index: i }))
      const merged = normalizeJob({ ...j, checklist }, customers)
      try {
        await trackSync(
          (async () => {
            const { error } = await supabase
              .from('job_checklist_items')
              .delete()
              .eq('job_id', jobId)
              .eq('id', itemId)
            if (error) throw error
            for (const item of checklist) {
              await persistChecklistItem(item)
            }
          })(),
          { error: 'Could not update checklist' },
        )
        setJobs((prev) => prev.map((x) => (x.id === jobId ? merged : x)))
      } catch (error) {
        logDataError('delete checklist item', error)
        await refreshWorkspaceStateFromDb()
      }
    },
    [customers, jobs, persistChecklistItem, trackSync, refreshWorkspaceStateFromDb],
  )

  const startWork = useCallback(
    async (jobId: string) => {
      const j = jobs.find((x) => x.id === jobId)
      if (!j || j.work_started_at) return
      const next: Job = {
        ...j,
        work_started_at: new Date().toISOString(),
        status: j.status === 'scheduled' || j.status === 'unassigned' ? 'in_progress' : j.status,
      }
      const normalized = normalizeJob(next, customers)
      try {
        await trackSync(persistJobWorkState(normalized), {
          success: 'Job started',
          error: 'Could not save start time',
        })
        setJobs((prev) => prev.map((row) => (row.id === jobId ? normalized : row)))
      } catch (error) {
        logDataError('start work', error)
        await refreshWorkspaceStateFromDb()
      }
    },
    [customers, jobs, persistJobWorkState, refreshWorkspaceStateFromDb, trackSync],
  )

  const undoStartWork = useCallback(
    async (jobId: string) => {
      const j = jobs.find((x) => x.id === jobId)
      if (!j || !j.work_started_at || j.work_completed_at) return
      if (j.status === 'completed' || j.status === 'canceled') return

      const nextStatus: JobStatus = j.assignees.length > 0 ? 'scheduled' : 'unassigned'
      const next: Job = {
        ...j,
        work_started_at: null,
        status: nextStatus,
      }
      const normalized = normalizeJob(next, customers)
      try {
        await trackSync(persistJobWorkState(normalized), {
          success: 'Start time cleared',
          error: 'Could not clear start time',
        })
        setJobs((prev) => prev.map((row) => (row.id === jobId ? normalized : row)))
      } catch (error) {
        logDataError('undo start work', error)
        await refreshWorkspaceStateFromDb()
      }
    },
    [customers, jobs, persistJobWorkState, refreshWorkspaceStateFromDb, trackSync],
  )

  const completeWork = useCallback(
    async (jobId: string): Promise<{ ok: boolean; reason?: string }> => {
      const job = jobs.find((j) => j.id === jobId)
      if (!job) return { ok: false, reason: 'Job not found.' }
      const tasks = jobTasks.filter((t) => t.job_id === jobId)
      const photos = taskPhotos.filter((photo) => tasks.some((task) => task.id === photo.task_id))
      const { ok, reason } = canMarkJobComplete(job.checklist, tasks, photos, {
        requiresPhotos: job.requires_photos,
      })
      if (!ok) return { ok: false, reason }

      const next: Job = {
        ...job,
        work_completed_at: new Date().toISOString(),
        status: 'needs_verification',
        verification_feedback: '',
      }
      const normalized = normalizeJob(next, customers)
      try {
        await trackSync(persistJobWorkState(normalized), {
          success: 'Job submitted for verification',
          error: 'Could not submit job',
        })
        setJobs((prev) => prev.map((j) => (j.id === jobId ? normalized : j)))
        return { ok: true }
      } catch (error) {
        logDataError('complete work', error)
        await refreshWorkspaceStateFromDb()
        return { ok: false, reason: 'Could not save. Please try again.' }
      }
    },
    [customers, jobTasks, jobs, persistJobWorkState, refreshWorkspaceStateFromDb, taskPhotos, trackSync],
  )

  const verifyJob = useCallback(
    async (jobId: string): Promise<{ ok: boolean; reason?: string }> => {
      const job = jobs.find((j) => j.id === jobId)
      if (!job) return { ok: false, reason: 'Job not found.' }
      if (job.status !== 'needs_verification') {
        return { ok: false, reason: 'Only jobs that need verification can be approved.' }
      }
      const tasks = jobTasks.filter((t) => t.job_id === jobId)
      const photos = taskPhotos.filter((photo) => tasks.some((task) => task.id === photo.task_id))
      const { ok, reason } = canMarkJobComplete(job.checklist, tasks, photos, {
        requiresPhotos: job.requires_photos,
      })
      if (!ok) return { ok: false, reason }

      const verified = normalizeJob({ ...job, status: 'verified', verification_feedback: '' }, customers)
      try {
        await trackSync(persistJob(verified), {
          success: 'Job verified',
          error: 'Could not verify job',
        })
        setJobs((prev) => prev.map((j) => (j.id === jobId ? verified : j)))
        return { ok: true }
      } catch (error) {
        logDataError('verify job', error)
        await refreshWorkspaceStateFromDb()
        return { ok: false, reason: 'Could not save. Please try again.' }
      }
    },
    [customers, jobTasks, jobs, persistJob, refreshWorkspaceStateFromDb, taskPhotos, trackSync],
  )

  const sendJobBack = useCallback(
    async (jobId: string, feedback: string): Promise<{ ok: boolean; reason?: string }> => {
      const trimmed = feedback.trim()
      if (!trimmed) return { ok: false, reason: 'Add feedback before sending this job back.' }
      const job = jobs.find((j) => j.id === jobId)
      if (!job) return { ok: false, reason: 'Job not found.' }
      if (job.status !== 'needs_verification') {
        return { ok: false, reason: 'Only jobs awaiting verification can be sent back.' }
      }

      const returned = normalizeJob(
        {
          ...job,
          status: 'in_progress',
          work_completed_at: null,
          verification_feedback: trimmed,
        },
        customers,
      )
      try {
        await trackSync(persistJob(returned), {
          success: 'Job sent back to crew',
          error: 'Could not send job back',
        })
        setJobs((prev) => prev.map((j) => (j.id === jobId ? returned : j)))
        return { ok: true }
      } catch (error) {
        logDataError('send job back', error)
        await refreshWorkspaceStateFromDb()
        return { ok: false, reason: 'Could not save. Please try again.' }
      }
    },
    [customers, jobs, persistJob, refreshWorkspaceStateFromDb, trackSync],
  )

  const getEmployeeDaySchedules = useCallback(
    (employeeId: string) => employeeDaySchedules.filter((r) => r.employee_id === employeeId),
    [employeeDaySchedules],
  )

  const upsertEmployeeDaySchedule = useCallback(
    (input: Omit<EmployeeDaySchedule, 'id'> & { id?: string }): EmployeeDaySchedule => {
      let result!: EmployeeDaySchedule
      setEmployeeDaySchedules((prev) => {
        const match = prev.findIndex(
          (r) => r.employee_id === input.employee_id && r.date === input.date,
        )
        const id = match >= 0 ? prev[match].id : input.id ?? newId()
        result = {
          id,
          employee_id: input.employee_id,
          date: input.date,
          status: input.status,
          start_time: input.start_time ?? null,
          end_time: input.end_time ?? null,
          notes: input.notes ?? null,
        }
        void (async () => {
          const orgId = requireOrgId(organizationId)
          const actorId = requireUserId(userId)
          const { error } = await supabase.from('employee_day_schedules').upsert({
            id: result.id,
            organization_id: orgId,
            employee_id: result.employee_id,
            date: result.date,
            status: result.status,
            start_time: result.start_time,
            end_time: result.end_time,
            notes: result.notes,
            updated_by: actorId,
            created_by: actorId,
          })
          if (error) throw error
        })().catch((error) => logDataError('save employee day schedule', error))
        if (match >= 0) {
          const next = [...prev]
          next[match] = result
          return next
        }
        return [...prev, result]
      })
      return result
    },
    [organizationId, userId],
  )

  const deleteEmployeeDaySchedule = useCallback((id: string) => {
    setEmployeeDaySchedules((prev) => prev.filter((r) => r.id !== id))
    void (async () => {
      const { error } = await supabase.from('employee_day_schedules').delete().eq('id', id)
      if (error) throw error
    })().catch((error) => logDataError('delete employee day schedule', error))
  }, [])

  const value = useMemo<AppDataContextValue>(
    () => ({
      customers,
      jobs,
      employees,
      employeeInvites,
      jobTasks,
      taskPhotos,
      isLoading,
      employeeDaySchedules,
      addCustomer,
      updateCustomer,
      getCustomer,
      addJob,
      updateJob,
      deleteJob,
      getJob,
      addEmployee,
      updateEmployee,
      getEmployee,
      createEmployeeInvite,
      getTasksForJob,
      addJobTask,
      updateJobTask,
      getPhotosForTask,
      addTaskPhoto,
      updateTaskPhoto,
      deleteTaskPhoto,
      updateChecklistItem,
      addChecklistItem,
      updateChecklistItemTitle,
      deleteChecklistItem,
      startWork,
      undoStartWork,
      completeWork,
      verifyJob,
      sendJobBack,
      getEmployeeDaySchedules,
      upsertEmployeeDaySchedule,
      deleteEmployeeDaySchedule,
    }),
    [
      customers,
      jobs,
      employees,
      employeeInvites,
      jobTasks,
      taskPhotos,
      isLoading,
      employeeDaySchedules,
      addCustomer,
      updateCustomer,
      getCustomer,
      addJob,
      updateJob,
      deleteJob,
      getJob,
      addEmployee,
      updateEmployee,
      getEmployee,
      createEmployeeInvite,
      getTasksForJob,
      addJobTask,
      updateJobTask,
      getPhotosForTask,
      addTaskPhoto,
      updateTaskPhoto,
      deleteTaskPhoto,
      updateChecklistItem,
      addChecklistItem,
      updateChecklistItemTitle,
      deleteChecklistItem,
      startWork,
      undoStartWork,
      completeWork,
      verifyJob,
      sendJobBack,
      getEmployeeDaySchedules,
      upsertEmployeeDaySchedule,
      deleteEmployeeDaySchedule,
    ],
  )

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  )
}
