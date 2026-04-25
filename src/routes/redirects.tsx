import { Navigate, useLocation } from 'react-router-dom'
import { homePathForRole } from '../auth/routeAccess'
import { useAuth } from '../hooks/useAuth'

/** Unknown paths → login when anonymous, otherwise the app home. */
export function CatchAllRedirect() {
  const { user, isReady } = useAuth()
  const location = useLocation()
  if (!isReady) return null
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return <Navigate to={homePathForRole(user.role)} replace />
}
