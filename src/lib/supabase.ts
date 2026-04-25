import { createClient, type Session, type User } from '@supabase/supabase-js'
import type { Profile, UserRole } from '../types/profile'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export const supabaseReady = true

type ProfileRow = {
  id: string
  full_name: string | null
  email: string | null
  role: UserRole | null
  created_at: string | null
  updated_at: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: Profile['subscription_status']
  trial_ends_at: string | null
  is_active: boolean | null
}

export interface AuthResult {
  user: User
  session: Session | null
  profile: Profile | null
}

export interface SignInResult extends AuthResult {
  profile: Profile
}

function profileNameFromEmail(email: string) {
  return email.split('@')[0] || 'StackLess User'
}

function normalizeProfile(row: ProfileRow): Profile {
  const email = row.email ?? ''
  return {
    id: row.id,
    full_name: row.full_name ?? profileNameFromEmail(email),
    email,
    phone: '',
    role: row.role ?? 'admin',
    status: 'active',
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? undefined,
    stripe_customer_id: row.stripe_customer_id ?? null,
    stripe_subscription_id: row.stripe_subscription_id ?? null,
    subscription_status: row.subscription_status ?? null,
    trial_ends_at: row.trial_ends_at ?? null,
    is_active: row.is_active ?? false,
    employee_id: null,
    auth_mode: 'production',
  }
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, full_name, email, role, created_at, updated_at, stripe_customer_id, stripe_subscription_id, subscription_status, trial_ends_at, is_active',
    )
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return data ? normalizeProfile(data as ProfileRow) : null
}

async function waitForProfile(userId: string): Promise<Profile | null> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const profile = await getProfile(userId)
    if (profile) return profile
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  return null
}

export async function signUp(email: string, password: string): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase()
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        full_name: profileNameFromEmail(normalizedEmail),
      },
    },
  })

  if (error) throw error
  if (!data.user) throw new Error('Supabase did not return a user after signup.')

  const profile = data.session ? await waitForProfile(data.user.id) : null
  return { user: data.user, session: data.session, profile }
}

export async function signIn(email: string, password: string): Promise<SignInResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })

  if (error) throw error
  if (!data.user) throw new Error('Supabase did not return a user after sign in.')

  const profile = await getProfile(data.user.id)
  if (!profile) throw new Error('No profile was found for this account.')

  return { user: data.user, session: data.session, profile }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function healthCheckSupabase(): Promise<'connected'> {
  return 'connected'
}
