import { supabase } from './supabase'
import type { EmployeeInvite } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4242'

export type SendInviteResult =
  | { invite: EmployeeInvite; email_sent: true }
  | { invite: EmployeeInvite; email_sent: false; error: string }

export async function sendEmployeeInviteEmail(input: {
  email: string
  employeeId: string
  organizationId: string
}): Promise<SendInviteResult> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  const token = data.session?.access_token
  if (!token) throw new Error('Please sign in before sending invites.')

  const response = await fetch(`${API_BASE_URL}/api/send-invite`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  const body = (await response.json()) as {
    invite?: EmployeeInvite
    email_sent?: boolean
    error?: string
  }

  if (!response.ok) {
    if (response.status === 502 && body.invite) {
      return {
        invite: body.invite,
        email_sent: false as const,
        error: body.error ?? 'Could not deliver invite email.',
      }
    }
    throw new Error(body.error ?? 'Unable to send invite.')
  }

  if (!body.invite || body.email_sent !== true) {
    throw new Error(body.error ?? 'Unexpected response from invite server.')
  }

  return { invite: body.invite, email_sent: true }
}
