/** Single day availability / PTO row for an employee (YYYY-MM-DD). */
export type EmployeeDayScheduleStatus =
  | 'working'
  | 'off'
  | 'vacation'
  | 'sick'
  | 'unavailable'

export interface EmployeeDaySchedule {
  id: string
  employee_id: string
  /** ISO date YYYY-MM-DD */
  date: string
  status: EmployeeDayScheduleStatus
  start_time?: string | null
  end_time?: string | null
  notes?: string | null
}
