import { supabase } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4242'

async function requestBillingUrl(path: string): Promise<string> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  const token = data.session?.access_token
  if (!token) throw new Error('Please sign in before opening billing.')

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  const body = (await response.json()) as { url?: string; error?: string }
  if (!response.ok || !body.url) {
    throw new Error(body.error ?? 'Unable to open billing.')
  }

  return body.url
}

export async function createCheckoutSession() {
  return requestBillingUrl('/api/create-checkout-session')
}

export async function createPortalSession() {
  return requestBillingUrl('/api/create-portal-session')
}
