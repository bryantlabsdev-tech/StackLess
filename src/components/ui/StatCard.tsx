import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

const accents = {
  emerald:
    'bg-emerald-50 text-emerald-700 ring-emerald-100/80 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/25',
  sky: 'bg-blue-50 text-blue-700 ring-blue-100/80 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/25',
  amber:
    'bg-amber-50 text-amber-800 ring-amber-100/80 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/25',
  violet:
    'bg-violet-50 text-violet-700 ring-violet-100/80 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/25',
  slate:
    'bg-slate-100 text-slate-700 ring-slate-200/80 dark:bg-white/[0.04] dark:text-slate-300 dark:ring-white/10',
} as const

export function StatCard({
  label,
  value,
  hint,
  to,
  icon,
  accent = 'emerald',
}: {
  label: string
  value: number
  hint: string
  to: string
  icon: ReactNode
  accent?: keyof typeof accents
}) {
  return (
    <Link
      to={to}
      className="group block rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg dark:border-[#1F2A36] dark:bg-[#11161D] dark:shadow-black/20 dark:hover:border-blue-500/45 dark:hover:shadow-black/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${accents[accent]}`}
        >
          {icon}
        </div>
        <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-500 opacity-0 transition group-hover:opacity-100 dark:bg-[#151B23] dark:text-[#94A3B8]">
          View
        </span>
      </div>
      <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#94A3B8]">{label}</div>
      <div className="mt-1 text-3xl font-semibold tabular-nums tracking-[-0.04em] text-slate-950 dark:text-[#F8FAFC]">
        {value}
      </div>
      <p className="mt-2 text-sm leading-snug text-slate-500 dark:text-[#94A3B8]">{hint}</p>
    </Link>
  )
}
