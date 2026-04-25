import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ensureJobExecutionFields } from '../lib/ensureJob'
import { migrateAssigneeIdsFromUnknown, stripLegacyAssignFields } from '../lib/jobAssignees'
import { normalizeJobTask } from '../lib/normalizeJobTask'
import type { PhotoLabelId } from '../lib/taskPhotoLabels'
import { normalizeTaskPhoto } from '../lib/taskPhotoUtils'
import { canMarkJobComplete } from '../lib/jobCompletion'
import { AppDataContext, type AppDataContextValue } from './appDataContext'
import type {
  Customer,
  Employee,
  EmployeeDaySchedule,
  Job,
  JobStatus,
  JobTask,
  TaskPhoto,
} from '../types'

const STORAGE_KEY = 'groundwork_ops_v1'

const LEGACY_BOOTSTRAP_CUSTOMER_IDS = new Set(['c1', 'c2', 'c3'])
const LEGACY_BOOTSTRAP_EMPLOYEE_IDS = new Set(['e1', 'e2', 'e3'])
const LEGACY_BOOTSTRAP_JOB_IDS = new Set(['j1', 'j2', 'j3', 'j4'])

interface PersistedState {
  customers: Customer[]
  jobs: Job[]
  employees: Employee[]
  jobTasks?: JobTask[]
  taskPhotos?: TaskPhoto[]
  employeeDaySchedules?: EmployeeDaySchedule[]
}

function loadState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return removeLegacyBootstrapRows(JSON.parse(raw) as Partial<PersistedState>)
  } catch {
    return null
  }
}

function saveState(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

function newId(): string {
  return crypto.randomUUID()
}

function removeLegacyBootstrapRows(state: Partial<PersistedState>): PersistedState {
  const customers = (state.customers ?? []).filter((c) => !LEGACY_BOOTSTRAP_CUSTOMER_IDS.has(c.id))
  const employees = (state.employees ?? []).filter((e) => !LEGACY_BOOTSTRAP_EMPLOYEE_IDS.has(e.id))
  const jobs = (state.jobs ?? []).filter(
    (j) =>
      !LEGACY_BOOTSTRAP_JOB_IDS.has(j.id) &&
      !LEGACY_BOOTSTRAP_CUSTOMER_IDS.has(j.customer_id),
  )
  const jobIds = new Set(jobs.map((j) => j.id))
  const jobTasks = (state.jobTasks ?? []).filter((t) => jobIds.has(t.job_id))
  const taskIds = new Set(jobTasks.map((t) => t.id))
  const taskPhotos = (state.taskPhotos ?? []).filter((p) => taskIds.has(p.task_id))
  const employeeDaySchedules = (state.employeeDaySchedules ?? []).filter(
    (r) => !LEGACY_BOOTSTRAP_EMPLOYEE_IDS.has(r.employee_id),
  )

  return { customers, jobs, employees, jobTasks, taskPhotos, employeeDaySchedules }
}

function normalizeJob(job: Job, customers: Customer[]): Job {
  const c = customers.find((x) => x.id === job.customer_id)
  const assignees = [...new Set(migrateAssigneeIdsFromUnknown(job))]

  let status: JobStatus = job.status
  if (assignees.length === 0 && status !== 'canceled' && status !== 'completed') {
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

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const s = loadState()
    return s?.customers ?? []
  })
  const [jobs, setJobs] = useState<Job[]>(() => {
    const s = loadState()
    const raw = s?.jobs ?? []
    return raw.map((j) => ensureJobExecutionFields(j as Job))
  })
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const s = loadState()
    return s?.employees ?? []
  })
  const [jobTasks, setJobTasks] = useState<JobTask[]>(() => {
    const s = loadState()
    const raw = s?.jobTasks ?? []
    return raw.map((t) => normalizeJobTask(t))
  })
  const [taskPhotos, setTaskPhotos] = useState<TaskPhoto[]>(() => {
    const s = loadState()
    const raw = s?.taskPhotos ?? []
    return raw.map((p) => normalizeTaskPhoto(p))
  })
  const [employeeDaySchedules, setEmployeeDaySchedules] = useState<EmployeeDaySchedule[]>(() => {
    const s = loadState()
    return s?.employeeDaySchedules ?? []
  })

  useEffect(() => {
    saveState({ customers, jobs, employees, jobTasks, taskPhotos, employeeDaySchedules })
  }, [customers, jobs, employees, jobTasks, taskPhotos, employeeDaySchedules])

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
            id: newId(),
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

  const addCustomer = useCallback((input: Omit<Customer, 'id'>) => {
    const c: Customer = { ...input, id: newId() }
    setCustomers((prev) => [...prev, c])
    return c
  }, [])

  const updateCustomer = useCallback(
    (id: string, patch: Partial<Customer>) => {
      setCustomers((prevC) => {
        const nextC = prevC.map((c) => (c.id === id ? { ...c, ...patch } : c))
        setJobs((prevJ) =>
          prevJ.map((j) =>
            j.customer_id === id
              ? normalizeJob({ ...j, customer_id: id } as Job, nextC)
              : j,
          ),
        )
        return nextC
      })
    },
    [],
  )

  const getCustomer = useCallback(
    (id: string) => customers.find((c) => c.id === id),
    [customers],
  )

  const addEmployee = useCallback((input: Omit<Employee, 'id'>) => {
    const e: Employee = { ...input, id: newId() }
    setEmployees((prev) => [...prev, e])
    return e
  }, [])

  const updateEmployee = useCallback(
    (id: string, patch: Partial<Employee>) => {
      setEmployees((prevE) => {
        const nextE = prevE.map((e) => (e.id === id ? { ...e, ...patch } : e))
        setJobs((prevJ) =>
          prevJ.map((j) =>
            j.assignees.includes(id) ? normalizeJob({ ...j } as Job, customers) : j,
          ),
        )
        return nextE
      })
    },
    [customers],
  )

  const getEmployee = useCallback(
    (id: string) => employees.find((e) => e.id === id),
    [employees],
  )

  const updateJob = useCallback(
    (id: string, patch: Partial<Job>) => {
      setJobs((prev) => {
        const current = prev.find((x) => x.id === id)
        if (!current) return prev
        let merged = normalizeJob({ ...current, ...patch } as Job, customers)

        if (patch.status === 'completed') {
          const tasks = jobTasks.filter((t) => t.job_id === id)
          const { ok } = canMarkJobComplete(merged.checklist, tasks)
          if (!ok) {
            merged = { ...merged, status: current.status }
          }
        }

        return prev.map((x) => (x.id === id ? merged : x))
      })
    },
    [customers, jobTasks],
  )

  const addJob = useCallback(
    (input: Omit<Job, 'id'>) => {
      const j = normalizeJob({ ...input, id: newId() }, customers)
      setJobs((prev) => [...prev, j])
      const task: JobTask = {
        id: newId(),
        job_id: j.id,
        title: 'Complete visit',
        description:
          j.notes?.trim() ||
          'Follow the work instructions above. Add more tasks if this job has multiple steps.',
        is_completed: false,
      }
      setJobTasks((prev) => [...prev, task])
      return j
    },
    [customers],
  )

  const deleteJob = useCallback(
    (id: string) => {
      const taskIds = jobTasks.filter((t) => t.job_id === id).map((t) => t.id)
      setJobs((prev) => prev.filter((x) => x.id !== id))
      setJobTasks((prev) => prev.filter((t) => t.job_id !== id))
      setTaskPhotos((prev) => prev.filter((p) => !taskIds.includes(p.task_id)))
    },
    [jobTasks],
  )

  const getJob = useCallback(
    (id: string) => jobs.find((j) => j.id === id),
    [jobs],
  )

  const getTasksForJob = useCallback(
    (jobId: string) => jobTasks.filter((t) => t.job_id === jobId),
    [jobTasks],
  )

  const addJobTask = useCallback((jobId: string, input: { title: string; description: string }) => {
    const row: JobTask = {
      id: newId(),
      job_id: jobId,
      title: input.title.trim() || 'Task',
      description: input.description.trim(),
      is_completed: false,
    }
    setJobTasks((prev) => [...prev, row])
    return row
  }, [])

  const updateJobTask = useCallback(
    (taskId: string, patch: Partial<Pick<JobTask, 'title' | 'description' | 'is_completed'>>) => {
      setJobTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)),
      )
    },
    [],
  )

  const getPhotosForTask = useCallback(
    (taskId: string) => taskPhotos.filter((p) => p.task_id === taskId),
    [taskPhotos],
  )

  const addTaskPhoto = useCallback(
    (input: {
      task_id: string
      image_url: string
      label: PhotoLabelId
      note: string
      uploaded_by: string
    }) => {
      const row: TaskPhoto = {
        ...input,
        id: newId(),
        created_at: new Date().toISOString(),
        updated_at: null,
      }
      setTaskPhotos((prev) => [...prev, row])
      return row
    },
    [],
  )

  const updateTaskPhoto = useCallback(
    (id: string, patch: Partial<Pick<TaskPhoto, 'image_url' | 'label' | 'note'>>) => {
      setTaskPhotos((prev) => {
        const cur = prev.find((p) => p.id === id)
        if (!cur) return prev
        const merged = normalizeTaskPhoto({
          ...cur,
          ...patch,
          updated_at: new Date().toISOString(),
        })
        return prev.map((p) => (p.id === id ? merged : p))
      })
    },
    [],
  )

  const deleteTaskPhoto = useCallback((id: string) => {
    setTaskPhotos((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const updateChecklistItem = useCallback((jobId: string, itemId: string, is_completed: boolean) => {
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== jobId) return j
        const checklist = j.checklist.map((c) =>
          c.id === itemId ? { ...c, is_completed } : c,
        )
        return normalizeJob({ ...j, checklist }, customers)
      }),
    )
  }, [customers])

  const addChecklistItem = useCallback(
    (jobId: string, title: string) => {
      const trimmed = title.trim()
      if (!trimmed) return
      setJobs((prev) =>
        prev.map((j) => {
          if (j.id !== jobId) return j
          const maxOrder = j.checklist.reduce((m, c) => Math.max(m, c.order_index), -1)
          const row = {
            id: newId(),
            job_id: jobId,
            title: trimmed,
            is_completed: false,
            order_index: maxOrder + 1,
          }
          return normalizeJob({ ...j, checklist: [...j.checklist, row] }, customers)
        }),
      )
    },
    [customers],
  )

  const updateChecklistItemTitle = useCallback(
    (jobId: string, itemId: string, title: string) => {
      const trimmed = title.trim()
      if (!trimmed) return
      setJobs((prev) =>
        prev.map((j) => {
          if (j.id !== jobId) return j
          const checklist = j.checklist.map((c) =>
            c.id === itemId ? { ...c, title: trimmed } : c,
          )
          return normalizeJob({ ...j, checklist }, customers)
        }),
      )
    },
    [customers],
  )

  const deleteChecklistItem = useCallback(
    (jobId: string, itemId: string) => {
      setJobs((prev) =>
        prev.map((j) => {
          if (j.id !== jobId) return j
          if (j.checklist.length <= 1) return j
          const filtered = j.checklist.filter((c) => c.id !== itemId)
          const checklist = filtered
            .sort((a, b) => a.order_index - b.order_index)
            .map((c, i) => ({ ...c, order_index: i }))
          return normalizeJob({ ...j, checklist }, customers)
        }),
      )
    },
    [customers],
  )

  const startWork = useCallback(
    (jobId: string) => {
      setJobs((prev) =>
        prev.map((j) => {
          if (j.id !== jobId) return j
          if (j.work_started_at) return j
          const next: Job = {
            ...j,
            work_started_at: new Date().toISOString(),
            status: j.status === 'scheduled' || j.status === 'unassigned' ? 'in_progress' : j.status,
          }
          return normalizeJob(next, customers)
        }),
      )
    },
    [customers],
  )

  const undoStartWork = useCallback(
    (jobId: string) => {
      setJobs((prev) =>
        prev.map((j) => {
          if (j.id !== jobId) return j
          if (!j.work_started_at) return j
          if (j.work_completed_at) return j
          if (j.status === 'completed' || j.status === 'canceled') return j

          const nextStatus: JobStatus = j.assignees.length > 0 ? 'scheduled' : 'unassigned'

          const next: Job = {
            ...j,
            work_started_at: null,
            status: nextStatus,
          }
          return normalizeJob(next, customers)
        }),
      )
    },
    [customers],
  )

  const completeWork = useCallback(
    (jobId: string): { ok: boolean; reason?: string } => {
      const job = jobs.find((j) => j.id === jobId)
      if (!job) return { ok: false, reason: 'Job not found.' }
      const tasks = jobTasks.filter((t) => t.job_id === jobId)
      const { ok, reason } = canMarkJobComplete(job.checklist, tasks)
      if (!ok) return { ok: false, reason }

      setJobs((prev) =>
        prev.map((j) => {
          if (j.id !== jobId) return j
          const next: Job = {
            ...j,
            work_completed_at: new Date().toISOString(),
            status: 'completed',
          }
          return normalizeJob(next, customers)
        }),
      )
      return { ok: true }
    },
    [customers, jobTasks, jobs],
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
        if (match >= 0) {
          const next = [...prev]
          next[match] = result
          return next
        }
        return [...prev, result]
      })
      return result
    },
    [],
  )

  const deleteEmployeeDaySchedule = useCallback((id: string) => {
    setEmployeeDaySchedules((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const value = useMemo<AppDataContextValue>(
    () => ({
      customers,
      jobs,
      employees,
      jobTasks,
      taskPhotos,
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
      getEmployeeDaySchedules,
      upsertEmployeeDaySchedule,
      deleteEmployeeDaySchedule,
    }),
    [
      customers,
      jobs,
      employees,
      jobTasks,
      taskPhotos,
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
      getEmployeeDaySchedules,
      upsertEmployeeDaySchedule,
      deleteEmployeeDaySchedule,
    ],
  )

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  )
}
