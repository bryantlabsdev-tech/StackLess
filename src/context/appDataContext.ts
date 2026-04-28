import { createContext } from 'react'
import type { PhotoLabelId } from '../lib/taskPhotoLabels'
import type { Customer, Employee, EmployeeDaySchedule, EmployeeInvite, Job, JobTask, TaskPhoto } from '../types'

export interface AppDataContextValue {
  customers: Customer[]
  jobs: Job[]
  employees: Employee[]
  employeeInvites: EmployeeInvite[]
  jobTasks: JobTask[]
  taskPhotos: TaskPhoto[]
  isLoading: boolean
  /** Per-day work / PTO / off rows (one preferred row per employee per date). */
  employeeDaySchedules: EmployeeDaySchedule[]
  addCustomer: (input: Omit<Customer, 'id'>) => Customer
  updateCustomer: (id: string, patch: Partial<Customer>) => void
  getCustomer: (id: string) => Customer | undefined
  addJob: (input: Omit<Job, 'id'>) => Promise<Job>
  updateJob: (id: string, patch: Partial<Job>) => Promise<void>
  deleteJob: (id: string) => Promise<void>
  getJob: (id: string) => Job | undefined
  addEmployee: (input: Omit<Employee, 'id'>) => Employee
  updateEmployee: (id: string, patch: Partial<Employee>) => void
  getEmployee: (id: string) => Employee | undefined
  createEmployeeInvite: (
    employeeId: string,
    input: { contact_email?: string; contact_phone?: string },
  ) => Promise<EmployeeInvite>
  updateEmployeeInviteContact: (
    inviteId: string,
    input: { contact_email?: string; contact_phone?: string },
  ) => Promise<EmployeeInvite>
  getTasksForJob: (jobId: string) => JobTask[]
  addJobTask: (jobId: string, input: { title: string; description: string }) => Promise<JobTask>
  updateJobTask: (
    taskId: string,
    patch: Partial<Pick<JobTask, 'title' | 'description' | 'is_completed'>>,
  ) => Promise<void>
  getPhotosForTask: (taskId: string) => TaskPhoto[]
  addTaskPhoto: (input: {
    task_id: string
    image_url: string
    storage_path?: string | null
    label: PhotoLabelId
    note: string
    uploaded_by_id?: string | null
    uploaded_by: string
  }) => Promise<TaskPhoto>
  updateTaskPhoto: (
    id: string,
    patch: Partial<Pick<TaskPhoto, 'image_url' | 'storage_path' | 'label' | 'note'>>,
  ) => Promise<void>
  deleteTaskPhoto: (id: string) => Promise<void>
  updateChecklistItem: (jobId: string, itemId: string, is_completed: boolean) => Promise<void>
  addChecklistItem: (jobId: string, title: string) => Promise<void>
  updateChecklistItemTitle: (jobId: string, itemId: string, title: string) => Promise<void>
  deleteChecklistItem: (jobId: string, itemId: string) => Promise<void>
  startWork: (jobId: string) => Promise<void>
  /** Clears field start time and restores status; only when started and not completed. */
  undoStartWork: (jobId: string) => Promise<void>
  completeWork: (jobId: string) => Promise<{ ok: boolean; reason?: string }>
  verifyJob: (jobId: string) => Promise<{ ok: boolean; reason?: string }>
  sendJobBack: (jobId: string, feedback: string) => Promise<{ ok: boolean; reason?: string }>
  getEmployeeDaySchedules: (employeeId: string) => EmployeeDaySchedule[]
  upsertEmployeeDaySchedule: (
    input: Omit<EmployeeDaySchedule, 'id'> & { id?: string },
  ) => EmployeeDaySchedule
  deleteEmployeeDaySchedule: (id: string) => void
  /** Reload workspace operational data from Supabase (includes invites after send-invite). */
  refreshWorkspaceFromDb: () => Promise<void>
}

export const AppDataContext = createContext<AppDataContextValue | null>(null)
