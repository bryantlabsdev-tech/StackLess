import type { Profile } from '../types/profile'

export function buildMockAdminProfile(): Profile {
  return {
    id: 'dev-profile-admin',
    full_name: 'Admin User',
    email: 'dev@local',
    phone: '',
    role: 'admin',
    status: 'active',
    created_at: new Date().toISOString(),
    organization_id: 'dev-organization',
    employee_id: null,
    auth_mode: 'development',
  }
}
