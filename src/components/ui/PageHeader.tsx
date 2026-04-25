import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-[#F8FAFC] sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-[#94A3B8]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:shrink-0">{action}</div> : null}
    </div>
  )
}
