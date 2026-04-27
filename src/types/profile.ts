export type UserRole = 'admin' | 'employee'

export type ProfileStatus = 'active' | 'inactive'
export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'paused'
  | 'unpaid'
  | null

/**
 * User profile — mirrors a future `profiles` table for Supabase Auth.
 * For employees, `employee_id` links to the `employees` record for job filtering.
 */
export interface Profile {
  id: string
  full_name: string
  email: string
  phone: string
  role: UserRole
  status: ProfileStatus
  created_at: string
  updated_at?: string
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  subscription_status?: SubscriptionStatus
  trial_ends_at?: string | null
  is_active?: boolean
  /** Tenant boundary for operational data. */
  organization_id?: string | null
  /** Set when `role === 'employee'` — matches `employees.id` */
  employee_id: string | null
  /** Present on mock / dev sessions; omit in production profiles if you prefer */
  auth_mode?: 'development' | 'production'
}
