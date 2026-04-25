import type { ButtonHTMLAttributes } from 'react'

const variants = {
  primary:
    'border border-blue-400/60 bg-blue-500 text-white shadow-lg shadow-blue-950/20 hover:bg-blue-400 active:bg-blue-600 dark:border-blue-400/50 dark:bg-blue-500 dark:hover:bg-blue-400',
  secondary:
    'border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50 active:bg-slate-100 dark:border-[#1F2A36] dark:bg-[#151B23] dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-[#1A2230]',
  ghost:
    'text-slate-700 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-300 dark:hover:bg-white/[0.06] dark:active:bg-white/[0.09]',
  danger: 'border border-red-400/50 bg-red-500 text-white shadow-lg shadow-red-950/20 hover:bg-red-400 active:bg-red-600',
} as const

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants
}) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 touch-manipulation items-center justify-center gap-2 rounded-[14px] px-4 py-2.5 text-sm font-semibold tracking-[-0.01em] transition-all duration-200 hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
