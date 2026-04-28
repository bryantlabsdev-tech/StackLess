import { supabase } from './supabase'
import type { EmployeeInvite } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4242'

export type InviteDeliveryInfo = {
  attempted_sms: boolean
  sms_sent: boolean
  sms_error: string | null
  attempted_email: boolean
  email_sent: boolean
  email_error: string | null
}

export type SendInviteResponse =
  | { ok: true; invite: EmployeeInvite; delivery: InviteDeliveryInfo }
  | { ok: false; invite: EmployeeInvite; delivery: InviteDeliveryInfo; error: string }

/** Sends invite via SMS (Twilio) and/or email (Resend); SMS first when both are sent. */
export async function sendInvite(input: {
  employeeId: string
  organizationId: string
  email?: string
  phone?: string
}): Promise<SendInviteResponse> {
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
    delivery?: InviteDeliveryInfo
    error?: string
  }

  if (!response.ok) {
    if (response.status === 502 && body.invite && body.delivery) {
      return {
        ok: false,
        invite: body.invite,
        delivery: body.delivery,
        error: body.error ?? 'Could not deliver invite.',
      }
    }
    throw new Error(body.error ?? 'Unable to send invite.')
  }

  if (!body.invite || !body.delivery) {
    throw new Error(body.error ?? 'Unexpected response from invite server.')
  }

  return { ok: true, invite: body.invite, delivery: body.delivery }
}
