import type { ComponentType } from 'react'
import { NavLink } from 'react-router-dom'

type NavIcon = ComponentType<{ className?: string }>

/** Paths where NavLink should match exactly (no nested active state). */
const NAV_LINK_END: Record<string, true> = {
  '/dashboard': true,
  '/calendar': true,
  '/customers': true,
  '/employee-dashboard': true,
  '/my-schedule': true,
}

export function MobileBottomNav({
  items,
}: {
  items: readonly { to: string; label: string; Icon: NavIcon }[]
}) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/90 bg-white/[0.95] pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_40px_-12px_rgba(15,23,42,0.12)] backdrop-blur-xl backdrop-saturate-150 dark:border-[#1F2A36] dark:bg-[#0B0F14]/[0.96] dark:shadow-[0_-12px_44px_-14px_rgba(0,0,0,0.55)] md:hidden"
      role="navigation"
      aria-label="Main"
    >
      <div className="flex w-full items-stretch justify-between gap-0.5 px-1 pt-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={NAV_LINK_END[item.to] === true}
            className={({ isActive }) =>
              [
                'relative flex min-h-[3.75rem] min-w-0 flex-1 touch-manipulation flex-col items-center justify-center gap-1 rounded-t-[14px] px-0.5 py-1.5 transition-[color,background-color] duration-200 select-none [-webkit-tap-highlight-color:transparent]',
                isActive
                  ? 'text-blue-700 dark:text-blue-200'
                  : 'text-slate-500 hover:text-slate-900 active:bg-slate-100/80 dark:text-slate-400 dark:hover:text-white dark:active:bg-white/[0.06]',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                {isActive ? (
                  <span
                    className="pointer-events-none absolute inset-x-1 top-1 bottom-0 rounded-[14px] bg-gradient-to-b from-blue-500/[0.1] via-transparent to-transparent dark:from-blue-400/[0.14]"
                    aria-hidden
                  />
                ) : null}
                {isActive ? (
                  <span
                    className="absolute left-1/2 top-0 h-[3px] w-11 -translate-x-1/2 rounded-b-full bg-blue-500 shadow-[0_2px_12px_rgba(59,130,246,0.45)] dark:bg-blue-400"
                    aria-hidden
                  />
                ) : null}
                <span
                  className={[
                    'relative z-[1] flex h-11 min-w-[2.75rem] max-w-full items-center justify-center rounded-2xl transition-[background-color,box-shadow,color,transform] duration-200',
                    isActive
                      ? 'bg-white text-blue-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_4px_16px_-6px_rgba(59,130,246,0.45)] ring-1 ring-blue-200/90 dark:bg-[#151B23] dark:text-blue-100 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_6px_22px_-10px_rgba(59,130,246,0.35)] dark:ring-blue-500/25'
                      : 'text-slate-500 dark:text-slate-400',
                  ].join(' ')}
                  aria-hidden
                >
                  <item.Icon className="!h-6 !w-6" />
                </span>
                <span
                  className={[
                    'relative z-[1] max-w-full truncate px-0.5 text-center text-[10px] leading-none tracking-tight',
                    isActive
                      ? 'font-semibold text-blue-900 dark:text-blue-50'
                      : 'font-medium text-slate-600 dark:text-slate-400',
                  ].join(' ')}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
