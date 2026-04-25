import { createContext } from 'react'
import type { PhotoLabelId } from '../lib/taskPhotoLabels'
import type { Customer, Employee, EmployeeDaySchedule, Job, JobTask, TaskPhoto } from '../types'

export interface AppDataContextValue {
  customers: Customer[]
  jobs: Job[]
  employees: Employee[]
  jobTasks: JobTask[]
  taskPhotos: TaskPhoto[]
  /** Per-day work / PTO / off rows (one preferred row per employee per date). */
  employeeDaySchedules: EmployeeDaySchedule[]
  addCustomer: (input: Omit<Customer, 'id'>) => Customer
  updateCustomer: (id: string, patch: Partial<Customer>) => void
  getCustomer: (id: string) => Customer | undefined
  addJob: (input: Omit<Job, 'id'>) => Job
  updateJob: (id: string, patch: Partial<Job>) => void
  deleteJob: (id: string) => void
  getJob: (id: string) => Job | undefined
  addEmployee: (input: Omit<Employee, 'id'>) => Employee
  updateEmployee: (id: string, patch: Partial<Employee>) => void
  getEmployee: (id: string) => Employee | undefined
  getTasksForJob: (jobId: string) => JobTask[]
  addJobTask: (jobId: string, input: { title: string; description: string }) => JobTask
  updateJobTask: (taskId: string, patch: Partial<Pick<JobTask, 'title' | 'description' | 'is_completed'>>) => void
  getPhotosForTask: (taskId: string) => TaskPhoto[]
  addTaskPhoto: (input: {
    task_id: string
    image_url: string
    label: PhotoLabelId
    note: string
    uploaded_by: string
  }) => TaskPhoto
  updateTaskPhoto: (
    id: string,
    patch: Partial<Pick<TaskPhoto, 'image_url' | 'label' | 'note'>>,
  ) => void
  deleteTaskPhoto: (id: string) => void
  updateChecklistItem: (jobId: string, itemId: string, is_completed: boolean) => void
  addChecklistItem: (jobId: string, title: string) => void
  updateChecklistItemTitle: (jobId: string, itemId: string, title: string) => void
  deleteChecklistItem: (jobId: string, itemId: string) => void
  startWork: (jobId: string) => void
  /** Clears field start time and restores status; only when started and not completed. */
  undoStartWork: (jobId: string) => void
  completeWork: (jobId: string) => { ok: boolean; reason?: string }
  getEmployeeDaySchedules: (employeeId: string) => EmployeeDaySchedule[]
  upsertEmployeeDaySchedule: (
    input: Omit<EmployeeDaySchedule, 'id'> & { id?: string },
  ) => EmployeeDaySchedule
  deleteEmployeeDaySchedule: (id: string) => void
}

export const AppDataContext = createContext<AppDataContextValue | null>(null)
