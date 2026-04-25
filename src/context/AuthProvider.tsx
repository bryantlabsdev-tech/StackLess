import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AUTH_DEVELOPMENT_BYPASS } from '../auth/config'
import {
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

  const login = useCallback(async (email: string, password: string) => {
    const { profile } = await signIn(email, password)
    setUser(profile)
    return profile
  }, [])

  const signup = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const result = await signUp(email, password)
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

  const logout = useCallback(async () => {
    await signOut()
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady,
      developmentBypass: AUTH_DEVELOPMENT_BYPASS,
      developmentPersona: undefined,
      setDevelopmentPersona: undefined,
      login,
      signup,
      refreshProfile,
      logout,
    }),
    [user, isReady, login, signup, refreshProfile, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
