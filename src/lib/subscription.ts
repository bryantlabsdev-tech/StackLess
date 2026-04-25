import type { Profile } from '../types/profile'

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing'])

export function hasSubscriptionAccess(profile: Profile | null) {
  if (!profile) return false
  return profile.is_active === true && ACTIVE_SUBSCRIPTION_STATUSES.has(profile.subscription_status ?? '')
}

export function formatTrialEnd(profile: Profile | null) {
  if (!profile?.trial_ends_at) return null
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(profile.trial_ends_at))
}
