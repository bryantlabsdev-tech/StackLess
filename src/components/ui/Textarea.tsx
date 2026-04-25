import type { TextareaHTMLAttributes } from 'react'

export function Textarea({
  className = '',
  id,
  label,
  rows = 3,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
}) {
  return (
    <div className="space-y-2">
      {label ? (
        <label htmlFor={id} className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
      ) : null}
      <textarea
        id={id}
        rows={rows}
        className={`min-h-11 w-full rounded-[14px] border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-950 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15 dark:border-[#1F2A36] dark:bg-[#11161D] dark:text-[#F8FAFC] dark:placeholder:text-slate-500 dark:focus:border-blue-400/80 dark:focus:bg-[#151B23] sm:text-sm ${className}`}
        {...props}
      />
    </div>
  )
}
