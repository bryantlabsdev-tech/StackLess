import { formatDisplayDate } from '../../lib/format'
import type { Job } from '../../types'
import { isUnassignedJob } from '../../lib/calendarFilters'
import { cal } from './calendarSurfaces'

export function UnassignedJobsPanel({
  jobs,
  onJobClick,
  onDragStart,
}: {
  jobs: Job[]
  onJobClick: (id: string) => void
  onDragStart?: (job: Job) => void
}) {
  const list = jobs.filter(isUnassignedJob).sort((a, b) => {
    const d = a.date.localeCompare(b.date)
    if (d !== 0) return d
    return a.start_time.localeCompare(b.start_time)
  })

  if (list.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 to-white px-3.5 py-3.5 shadow-md shadow-slate-900/[0.04] ring-1 ring-slate-900/[0.02] dark:border-emerald-800/50 dark:from-emerald-950/35 dark:to-slate-900 dark:shadow-black/25 dark:ring-emerald-900/30">
        <div className="flex items-start gap-2.5">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-100 dark:bg-slate-800 dark:text-emerald-400 dark:ring-emerald-800/80"
            aria-hidden
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 6L9 17l-5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-800 dark:text-emerald-300">
              Unassigned jobs
            </p>
            <p className="mt-1 text-[13px] font-medium leading-snug text-emerald-900/95 dark:text-emerald-50/95">
              Everything on the books has a crew. New unassigned work will land here.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`rounded-2xl border border-amber-300/50 bg-gradient-to-b from-amber-50 via-amber-50/70 to-white px-3.5 py-3.5 shadow-lg shadow-amber-900/[0.07] ring-1 ring-amber-200/60 dark:border-amber-800/60 dark:from-amber-950/45 dark:via-amber-950/25 dark:to-slate-900 dark:shadow-black/35 dark:ring-amber-900/45`}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-950 dark:text-amber-200">
            Unassigned jobs
          </p>
          <p className="mt-0.5 text-[12px] text-amber-900/80 dark:text-amber-200/90">
            Needs assignment — tap to open details
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold tabular-nums text-amber-950 ring-1 ring-amber-200/80 dark:bg-amber-950/75 dark:text-amber-50 dark:ring-amber-800">
          {list.length}
        </span>
      </div>
      <ul className="scroll-momentum mt-2.5 flex max-h-44 flex-col gap-1.5 overflow-y-auto overscroll-contain pr-0.5">
        {list.map((j) => (
          <li key={j.id}>
            <button
              type="button"
              data-job-id={j.id}
              draggable={Boolean(onDragStart)}
              onDragStartCapture={() => onDragStart?.(j)}
              onClick={() => onJobClick(j.id)}
              className="group flex w-full flex-col rounded-xl border border-amber-200/90 bg-white/95 px-2.5 py-2 text-left shadow-sm transition hover:border-amber-400/80 hover:shadow-md dark:border-amber-700/70 dark:bg-slate-800 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] dark:hover:border-amber-500/60 dark:hover:shadow-lg"
            >
              <span
                className={`truncate text-[13px] font-semibold text-slate-900 group-hover:text-amber-950 dark:text-white dark:group-hover:text-amber-100`}
              >
                {j.title}
              </span>
              <span className={`truncate text-[13px] ${cal.textMuted}`}>{j.customer_name}</span>
              <span className="mt-1 text-[11px] font-semibold tabular-nums text-amber-900/85 dark:text-amber-200">
                {formatDisplayDate(j.date)} · {j.start_time}–{j.end_time}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2.5 text-[11px] leading-snug text-amber-900/65 dark:text-amber-200/60">
        Drag-and-drop onto a day is planned — structure is ready for it.
      </p>
    </div>
  )
}
