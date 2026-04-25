import { useContext, useMemo } from 'react'
import { AuthContext } from '../context/authContext'

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return useMemo(
    () => ({
      ...ctx,
      isAdmin: ctx.user?.role === 'admin',
      isEmployee: ctx.user?.role === 'employee',
    }),
    [ctx],
  )
}
