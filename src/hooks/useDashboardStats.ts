import { useMemo } from 'react'
import { useAppData } from './useAppData'
import { formatISODate } from '../lib/format'

export function useDashboardStats() {
  const { customers, jobs } = useAppData()
  return useMemo(() => {
    const today = formatISODate(new Date())
    const closedStatuses = new Set(['completed', 'verified', 'canceled'])
    const jobsToday = jobs.filter((j) => j.date === today).length
    const openJobs = jobs.filter((j) => !closedStatuses.has(j.status)).length
    const unassignedJobs = jobs.filter(
      (j) =>
        j.assignees.length === 0 && !closedStatuses.has(j.status),
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
