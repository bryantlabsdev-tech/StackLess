import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { AuthLoading } from '../components/auth/AuthLoading'
import { homePathForRole } from '../auth/routeAccess'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'
import type { UserRole } from '../types/profile'

type RoleGuardProps = {
  /** Roles that may render `children` (e.g. admin-only shell). */
  allow: readonly UserRole[]
  children: ReactNode
}

function EmployeeSubscriptionBlocked() {
  const { logout } = useAuth()
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-[#0B0F14]">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200/80 bg-white/90 p-6 text-center shadow-xl dark:border-[#1F2A36] dark:bg-[#0B0F14]/90">
        <h1 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-[#F8FAFC]">
          Subscription inactive
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-[#94A3B8]">
          Your organization does not have an active subscription. Ask your administrator to renew billing,
          then sign in again.
        </p>
        <Button type="button" className="mt-6 w-full" onClick={() => void logout()}>
          Sign out
        </Button>
      </div>
    </main>
  )
}

/**
 * Protected shell: requires a Supabase session before rendering app routes.
 * Subscription is enforced per organization (any admin in the org with active/trialing billing).
 */
export function RoleGuard({ allow, children }: RoleGuardProps) {
  const { user, isReady, workspaceSubscriptionAccess, developmentBypass } = useAuth()
  const location = useLocation()

  if (!isReady) return <AuthLoading />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (!allow.includes(user.role)) {
    return <Navigate to={homePathForRole(user.role)} replace />
  }

  if (developmentBypass) {
    return <>{children}</>
  }

  if (
    user.organization_id &&
    workspaceSubscriptionAccess === null &&
    user.auth_mode !== 'development'
  ) {
    return <AuthLoading />
  }

  const hasAccess = workspaceSubscriptionAccess === true || user.auth_mode === 'development'

  const billingExempt =
    user.role === 'admin' && ['/billing', '/settings'].includes(location.pathname)

  if (!hasAccess && !billingExempt) {
    if (user.role === 'admin') {
      return <Navigate to="/billing" replace />
    }
    return <EmployeeSubscriptionBlocked />
  }

  return <>{children}</>
}
