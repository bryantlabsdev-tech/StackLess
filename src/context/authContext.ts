import { createContext } from 'react'
import type { AuthResult } from '../lib/supabase'
import type { Profile } from '../types/profile'

export interface AuthContextValue {
  user: Profile | null
  isReady: boolean
  /**
   * Whether the current user's organization has an active/trialing subscription (any admin in org).
   * `null` while resolving after sign-in.
   */
  workspaceSubscriptionAccess: boolean | null
  /** Legacy flag kept for shell UI while auth is backed by Supabase. */
  developmentBypass: boolean
  /** Legacy development persona hook. */
  developmentPersona?: 'admin'
  setDevelopmentPersona?: undefined
  login: (email: string, password: string) => Promise<Profile>
  signup: (email: string, password: string, inviteToken?: string) => Promise<AuthResult>
  acceptInvite: (inviteToken: string) => Promise<Profile>
  refreshProfile: () => Promise<Profile | null>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
