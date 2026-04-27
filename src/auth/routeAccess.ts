import type { UserRole } from '../types/profile'

/** Routes only admins may access (sidebar + URL). */
export const ADMIN_ROUTES = [
  '/dashboard',
  '/customers',
  '/employees',
  '/jobs',
  '/verification',
  '/calendar',
  '/settings',
  '/billing',
] as const

/** Routes only field crew may access. */
export const EMPLOYEE_ROUTES = ['/employee-dashboard', '/my-jobs', '/my-schedule'] as const

export function homePathForRole(role: UserRole): string {
  return role === 'admin' ? '/dashboard' : '/employee-dashboard'
}

/** Whether a path belongs to the role’s app area (exact or nested). */
export function isPathAllowedForRole(pathname: string, role: UserRole): boolean {
  const list = role === 'admin' ? ADMIN_ROUTES : EMPLOYEE_ROUTES
  return list.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

/**
 * After login (or when resolving `location.state.from`), only send the user to
 * URLs that match their role — never an admin URL for an employee or vice versa.
 */
export function safePostLoginPath(
  pathname: string | undefined,
  role: UserRole,
): string {
  if (!pathname || pathname === '/' || pathname === '/login' || pathname === '/signup') {
    return homePathForRole(role)
  }
  return isPathAllowedForRole(pathname, role) ? pathname : homePathForRole(role)
}
