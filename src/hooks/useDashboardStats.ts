import { useMemo } from 'react'
import { useAppData } from './useAppData'
import { formatISODate } from '../lib/format'

export function useDashboardStats() {
  const { customers, jobs } = useAppData()
  return useMemo(() => {
    const today = formatISODate(new Date())
    const jobsToday = jobs.filter((j) => j.date === today).length
    const openJobs = jobs.filter((j) => j.status !== 'completed' && j.status !== 'canceled').length
    const unassignedJobs = jobs.filter(
      (j) =>
        j.assignees.length === 0 && j.status !== 'completed' && j.status !== 'canceled',
    ).length
    return {
      totalCustomers: customers.length,
      totalJobs: jobs.length,
      openJobs,
      jobsToday,
      unassignedJobs,
    }
  }, [customers, jobs])
}
