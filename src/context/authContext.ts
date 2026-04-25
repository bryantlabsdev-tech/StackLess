import { createContext } from 'react'
import type { AuthResult } from '../lib/supabase'
import type { Profile } from '../types/profile'

export interface AuthContextValue {
  user: Profile | null
  isReady: boolean
  /** Legacy flag kept for shell UI while auth is backed by Supabase. */
  developmentBypass: boolean
  /** Legacy development persona hook. */
  developmentPersona?: 'admin'
  setDevelopmentPersona?: undefined
  login: (email: string, password: string) => Promise<Profile>
  signup: (email: string, password: string) => Promise<AuthResult>
  refreshProfile: () => Promise<Profile | null>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
