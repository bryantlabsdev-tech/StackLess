import type { ReactNode } from 'react'

export function EmptyState({
  title,
  detail,
  action,
}: {
  title: string
  detail?: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50/70 px-6 py-14 text-center shadow-inner dark:border-[#1F2A36] dark:bg-[#11161D]/70">
      <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg shadow-sm dark:border-[#1F2A36] dark:bg-[#151B23]">
        <span aria-hidden>+</span>
      </div>
      <p className="text-base font-semibold tracking-[-0.01em] text-slate-900 dark:text-[#F8FAFC]">{title}</p>
      {detail ? <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-[#94A3B8]">{detail}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  )
}
