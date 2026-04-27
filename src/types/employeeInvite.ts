export type EmployeeInviteStatus = 'pending' | 'accepted' | 'revoked'

export interface EmployeeInvite {
  id: string
  organization_id: string
  employee_id: string
  token: string
  contact_email: string | null
  contact_phone: string | null
  status: EmployeeInviteStatus
  invited_by: string | null
  accepted_by: string | null
  accepted_at: string | null
  expires_at: string | null
  created_at: string
}
