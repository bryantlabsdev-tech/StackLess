import type { AnchorHTMLAttributes } from 'react'
import { TESTFLIGHT_URL } from '../../lib/testflight'

const baseClass =
  'inline-flex min-h-11 touch-manipulation items-center justify-center gap-2 rounded-[14px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold tracking-[-0.01em] text-slate-800 shadow-sm transition-all duration-200 hover:-translate-y-px hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 dark:border-[#1F2A36] dark:bg-[#151B23] dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-[#1A2230]'

export function DownloadIosAppButton({
  href = TESTFLIGHT_URL,
  className = '',
  children,
  ...props
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'target' | 'rel'>) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${baseClass} ${className}`.trim()}
      {...props}
    >
      {children ?? 'Download iOS App'}
    </a>
  )
}
