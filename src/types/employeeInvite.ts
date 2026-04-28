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
  /** When the invite email was successfully sent via Resend (server-tracked). */
  email_sent_at: string | null
  /** Last email delivery failure message from the send-invite API. */
  email_send_error: string | null
  created_at: string
}
