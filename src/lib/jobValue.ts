import type { Job } from '../types'

export function normalizeJobValue(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

export function optionalJobValue(job: Job): number | null {
  return normalizeJobValue(job.job_value)
}

export function formatJobValue(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}
