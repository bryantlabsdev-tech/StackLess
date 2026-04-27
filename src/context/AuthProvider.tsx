import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AUTH_DEVELOPMENT_BYPASS } from '../auth/config'
import {
  acceptEmployeeInvite,
  fetchOrganizationSubscriptionAccess,
  getProfile,
  signIn,
  signOut,
  signUp,
  supabase,
  type AuthResult,
} from '../lib/supabase'
import { AuthContext, type AuthContextValue } from './authContext'
import type { Profile } from '../types/profile'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [workspaceSubscriptionAccess, setWorkspaceSubscriptionAccess] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true

    async function loadProfile(userId: string) {
      const profile = await getProfile(userId)
      if (!profile) throw new Error('No profile was found for this account.')
      return profile
    }

    async function hydrateSession() {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        const profile = data.session?.user ? await loadProfile(data.session.user.id) : null
        if (active) setUser(profile)
      } catch (error) {
        console.error('Failed to load Supabase session', error)
        if (active) setUser(null)
      } finally {
        if (active) setIsReady(true)
      }
    }

    hydrateSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsReady(false)
      if (!session?.user) {
        setUser(null)
        setIsReady(true)
        return
      }

      void loadProfile(session.user.id)
        .then((profile) => {
          if (active) setUser(profile)
        })
        .catch((error) => {
          console.error('Failed to load Supabase profile', error)
          if (active) setUser(null)
        })
        .finally(() => {
          if (active) setIsReady(true)
        })
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function resolveOrgSubscription() {
      if (!user) {
        setWorkspaceSubscriptionAccess(null)
        return
      }
      if (user.auth_mode === 'development') {
        setWorkspaceSubscriptionAccess(true)
        return
      }
      if (!user.organization_id) {
        setWorkspaceSubscriptionAccess(false)
        return
      }

      setWorkspaceSubscriptionAccess(null)
      try {
        const ok = await fetchOrganizationSubscriptionAccess(user.organization_id)
        if (!cancelled) setWorkspaceSubscriptionAccess(ok)
      } catch (error) {
        console.error('Failed to resolve organization subscription', error)
        if (!cancelled) setWorkspaceSubscriptionAccess(false)
      }
    }

    void resolveOrgSubscription()
    return () => {
      cancelled = true
    }
  }, [user])

  const login = useCallback(async (email: string, password: string) => {
    const { profile } = await signIn(email, password)
    setUser(profile)
    return profile
  }, [])

  const signup = useCallback(async (email: string, password: string, inviteToken?: string): Promise<AuthResult> => {
    const result = await signUp(email, password, inviteToken)
    if (result.session && result.profile) setUser(result.profile)
    return result
  }, [])

  const refreshProfile = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    if (!data.session?.user) {
      setUser(null)
      return null
    }

    const profile = await getProfile(data.session.user.id)
    setUser(profile)
    return profile
  }, [])

  const acceptInvite = useCallback(async (inviteToken: string) => {
    const profile = await acceptEmployeeInvite(inviteToken)
    setUser(profile)
    return profile
  }, [])

  const logout = useCallback(async () => {
    await signOut()
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady,
      workspaceSubscriptionAccess,
      developmentBypass: AUTH_DEVELOPMENT_BYPASS,
      developmentPersona: undefined,
      setDevelopmentPersona: undefined,
      login,
      signup,
      acceptInvite,
      refreshProfile,
      logout,
    }),
    [user, isReady, workspaceSubscriptionAccess, login, signup, acceptInvite, refreshProfile, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
