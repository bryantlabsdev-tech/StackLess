import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  IconCalendar,
  IconClipboard,
  IconDashboard,
  IconTeam,
  IconUsers,
} from '../icons'
import { useAuth } from '../../hooks/useAuth'
import { hasSubscriptionAccess } from '../../lib/subscription'
import { Button } from '../ui/Button'
import { JobModal } from '../jobs/JobModal'
import { MobileBottomNav } from './MobileBottomNav'
import { ThemeToggle } from './ThemeToggle'

const adminNav = [
  { to: '/dashboard', label: 'Dashboard', description: 'Overview', Icon: IconDashboard },
  { to: '/calendar', label: 'Schedule', description: 'Month view', Icon: IconCalendar },
  { to: '/jobs', label: 'Jobs', description: 'Work orders', Icon: IconClipboard },
  { to: '/customers', label: 'Customers', description: 'Accounts', Icon: IconUsers },
  { to: '/employees', label: 'Team', description: 'Crew', Icon: IconTeam },
] as const

export function AppShell({ variant }: { variant: 'admin' | 'employee' }) {
  void variant
  const navigate = useNavigate()
  const { user, logout, developmentBypass } = useAuth()
  const nav = adminNav
  const [jobOpen, setJobOpen] = useState(false)
  const hasAccess = hasSubscriptionAccess(user)

  const handleLogout = async () => {
    await logout()
    if (!developmentBypass) {
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 dark:bg-[#0B0F14] dark:text-slate-200">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl dark:border-[#1F2A36] dark:bg-[#0B0F14]/86 md:flex">
        <div className="flex h-[4.75rem] items-center gap-3 border-b border-slate-100 px-5 dark:border-[#1F2A36]">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-400/35 bg-blue-500 text-lg shadow-lg shadow-blue-950/20">
            <span aria-hidden className="select-none text-sm font-bold tracking-tight text-white">
              SL
            </span>
          </div>
          <div className="min-w-0">
            <div className="truncate text-[15px] font-semibold tracking-[-0.02em] text-slate-950 dark:text-[#F8FAFC]">
              StackLess
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-[#94A3B8]">
              Business command center
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1.5 p-3" aria-label="Main">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-[16px] px-3 py-3 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 text-blue-900 shadow-sm ring-1 ring-blue-100 dark:bg-blue-500/10 dark:text-blue-100 dark:ring-blue-500/20'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.05] dark:hover:text-slate-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-[13px] border shadow-sm transition ${
                      isActive
                        ? 'border-blue-200 bg-white text-blue-600 dark:border-blue-500/30 dark:bg-[#151B23] dark:text-blue-300'
                        : 'border-slate-200/80 bg-white text-slate-500 group-hover:text-slate-800 dark:border-[#1F2A36] dark:bg-[#11161D] dark:text-slate-500 dark:group-hover:text-slate-200'
                    }`}
                  >
                    <item.Icon />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col items-start leading-tight">
                    <span>{item.label}</span>
                    <span
                      className={`text-[11px] font-normal ${
                        isActive
                          ? 'text-blue-700/70 dark:text-blue-300/80'
                          : 'text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-400'
                      }`}
                    >
                      {item.description}
                    </span>
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-3 border-t border-slate-100 p-4 dark:border-[#1F2A36]">
          <ThemeToggle />
          {user && !developmentBypass ? (
            <div className="rounded-[16px] border border-slate-200/80 bg-slate-50 px-3 py-3 text-xs leading-relaxed dark:border-[#1F2A36] dark:bg-[#11161D]">
              <div className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{user.full_name}</div>
              <div className="truncate text-slate-500 dark:text-[#94A3B8]">{user.email}</div>
              <div className="mt-2 inline-flex rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-600 ring-1 ring-slate-200 dark:bg-blue-500/10 dark:text-blue-200 dark:ring-blue-500/25">
                {user.role}
              </div>
            </div>
          ) : null}
          {!developmentBypass ? (
            <Button variant="secondary" className="w-full" type="button" onClick={handleLogout}>
              Sign out
            </Button>
          ) : null}
          <p className="text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
            {developmentBypass
              ? 'Development session — enable real auth in auth/config.ts when ready.'
              : 'Signed in with Supabase.'}
          </p>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--page-bg)]">
        <header className="sticky top-0 z-40 flex min-h-14 flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 bg-white/90 px-3 py-2 backdrop-blur-xl dark:border-[#1F2A36] dark:bg-[#0B0F14]/88 md:hidden">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] bg-blue-500 text-base shadow-lg shadow-blue-950/20">
              <span aria-hidden className="text-xs font-bold tracking-tight text-white">
                SL
              </span>
            </div>
            <div className="min-w-0">
              <div className="truncate font-semibold text-slate-950 dark:text-[#F8FAFC]">StackLess</div>
              <div className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
                Command center
              </div>
            </div>
          </div>
          <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
            <div className="min-w-0 flex-1 sm:max-w-[140px] sm:flex-initial">
              <ThemeToggle className="!min-h-10 !py-2 !text-xs" />
            </div>
            {!developmentBypass ? (
              <Button variant="ghost" className="!px-2 !py-1 text-xs" type="button" onClick={handleLogout}>
                Out
              </Button>
            ) : null}
          </div>
        </header>

        <main className="w-full min-w-0 max-w-full flex-1 px-3 pb-[calc(7.75rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pt-8 md:px-8 md:py-8 lg:px-10">
          <Outlet />
        </main>

        {hasAccess ? (
          <Button
            type="button"
            className="fixed bottom-[calc(5.15rem+env(safe-area-inset-bottom))] right-3 z-50 min-h-12 rounded-full px-5 text-sm shadow-xl shadow-blue-950/25 md:hidden"
            onClick={() => setJobOpen(true)}
          >
            + Add Job
          </Button>
        ) : null}
        {hasAccess ? <MobileBottomNav items={nav} /> : null}
        <JobModal open={jobOpen} onClose={() => setJobOpen(false)} jobId={null} />
      </div>
    </div>
  )
}
