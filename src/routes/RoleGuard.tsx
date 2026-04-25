import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { AuthLoading } from '../components/auth/AuthLoading'
import { useAuth } from '../hooks/useAuth'
import { hasSubscriptionAccess } from '../lib/subscription'
import type { UserRole } from '../types/profile'

type Props = {
  /** Roles that may render `children` (e.g. admin-only shell). */
  allow: readonly UserRole[]
  children: ReactNode
}

/**
 * Protected shell: requires a Supabase session before rendering app routes.
 */
export function RoleGuard({ allow, children }: Props) {
  void allow
  const { user, isReady } = useAuth()
  const location = useLocation()

  if (!isReady) return <AuthLoading />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (location.pathname !== '/billing' && !hasSubscriptionAccess(user)) {
    return <Navigate to="/billing" replace />
  }

  return <>{children}</>
}
