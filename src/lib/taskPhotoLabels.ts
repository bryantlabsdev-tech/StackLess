/** Stage / intent labels for task instruction photos — used for filtering and badges. */

export const PHOTO_LABEL_IDS = ['before', 'during', 'after', 'issue', 'reference'] as const

export type PhotoLabelId = (typeof PHOTO_LABEL_IDS)[number]

export const PHOTO_LABEL_COPY: Record<PhotoLabelId, string> = {
  before: 'Before',
  during: 'During',
  after: 'After',
  issue: 'Issue',
  reference: 'Reference',
}

export function isPhotoLabelId(v: unknown): v is PhotoLabelId {
  return typeof v === 'string' && (PHOTO_LABEL_IDS as readonly string[]).includes(v)
}

/** Tailwind classes for compact label chips (light + dark). */
export function photoLabelBadgeClass(label: PhotoLabelId): string {
  switch (label) {
    case 'before':
      return 'bg-sky-100 text-sky-900 ring-sky-200/90 dark:bg-sky-950/80 dark:text-sky-100 dark:ring-sky-800'
    case 'during':
      return 'bg-violet-100 text-violet-900 ring-violet-200/90 dark:bg-violet-950/80 dark:text-violet-100 dark:ring-violet-800'
    case 'after':
      return 'bg-emerald-100 text-emerald-900 ring-emerald-200/90 dark:bg-emerald-950/80 dark:text-emerald-100 dark:ring-emerald-800'
    case 'issue':
      return 'bg-amber-100 text-amber-950 ring-amber-200/90 dark:bg-amber-950/60 dark:text-amber-100 dark:ring-amber-800'
    case 'reference':
    default:
      return 'bg-slate-200/90 text-slate-800 ring-slate-300/80 dark:bg-slate-700 dark:text-slate-100 dark:ring-slate-600'
  }
}
