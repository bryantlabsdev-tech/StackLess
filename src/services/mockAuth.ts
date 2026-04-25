import type { Profile } from '../types/profile'

const profilesByEmail: Record<string, Profile> = {}

export interface SignInResult {
  profile: Profile
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<SignInResult> {
  void password
  const normalized = email.trim().toLowerCase()
  await new Promise((r) => setTimeout(r, 350))
  const profile = profilesByEmail[normalized]
  if (!profile) {
    throw new Error('Invalid email or password.')
  }
  if (profile.status !== 'active') {
    throw new Error('This account is inactive.')
  }
  return { profile }
}

export function getProfileById(id: string): Profile | undefined {
  return Object.values(profilesByEmail).find((p) => p.id === id)
}

export function getProfileByEmail(email: string): Profile | undefined {
  return profilesByEmail[email.trim().toLowerCase()]
}
