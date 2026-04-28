import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import cors from 'cors'
import express from 'express'
import { Resend } from 'resend'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const PORT = process.env.SERVER_PORT || 4242
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const INVITE_APP_NAME = process.env.INVITE_APP_NAME || 'StackLess'
const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || 'StackLess <onboarding@resend.dev>'

const requiredEnv = [
  ['STRIPE_SECRET_KEY', process.env.STRIPE_SECRET_KEY],
  ['STRIPE_PRICE_ID', process.env.STRIPE_PRICE_ID],
  ['STRIPE_WEBHOOK_SECRET', process.env.STRIPE_WEBHOOK_SECRET],
  ['SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY],
  ['SUPABASE_URL or VITE_SUPABASE_URL', SUPABASE_URL],
]

const missingEnv = requiredEnv.filter(([, value]) => !value).map(([name]) => name)
if (missingEnv.length > 0) {
  throw new Error(`Missing required server environment variables: ${missingEnv.join(', ')}`)
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabaseAdmin = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

const app = express()

function appUrl(path) {
  return `${CLIENT_URL.replace(/\/$/, '')}/#${path}`
}

/** Hash-router signup URL with invite token (matches client `inviteLinkFor`). */
function signupInviteUrl(token) {
  return appUrl(`/signup?invite=${encodeURIComponent(token)}`)
}

function mapEmployeeInviteRow(row) {
  return {
    id: row.id,
    organization_id: row.organization_id,
    employee_id: row.employee_id,
    token: row.token,
    contact_email: row.contact_email,
    contact_phone: row.contact_phone,
    status: row.status,
    invited_by: row.invited_by,
    accepted_by: row.accepted_by,
    accepted_at: row.accepted_at,
    expires_at: row.expires_at,
    email_sent_at: row.email_sent_at ?? null,
    email_send_error: row.email_send_error ?? null,
    created_at: row.created_at,
  }
}

function buildInviteEmailHtml({ signupUrl, inviteeLabel }) {
  const safeLabel = inviteeLabel.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5;background:#f8fafc;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;padding:28px 24px;">
        <tr><td>
          <p style="margin:0 0 12px;font-size:16px;font-weight:600;color:#0f172a;">You're invited</p>
          <p style="margin:0 0 16px;font-size:15px;color:#334155;">${safeLabel}, your team invited you to join <strong>${INVITE_APP_NAME}</strong>. Use the button below to create your account and connect to your crew profile.</p>
          <table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0;">
            <tr><td align="center" style="border-radius:12px;background:#0f172a;">
              <a href="${signupUrl}" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Accept invitation</a>
            </td></tr>
          </table>
          <p style="margin:16px 0 0;font-size:12px;color:#64748b;">If the button does not work, copy this link into your browser:<br/><span style="word-break:break-all;color:#475569;">${signupUrl}</span></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function subscriptionIsActive(status) {
  return status === 'active' || status === 'trialing'
}

function timestampToIso(timestamp) {
  return timestamp ? new Date(timestamp * 1000).toISOString() : null
}

function stripeId(value) {
  if (!value) return null
  return typeof value === 'string' ? value : value.id
}

async function updateProfileSubscription({
  eventType,
  userId,
  customerId,
  subscriptionId,
  status,
  trialEndsAt,
}) {
  if (!userId || typeof userId !== 'string') {
    throw new Error(
      `[stripe:webhook] ${eventType}: user_id metadata is required to update the correct profile.`,
    )
  }

  const resolvedCustomerId = stripeId(customerId)
  const resolvedSubscriptionId = stripeId(subscriptionId)
  const update = {
    stripe_customer_id: resolvedCustomerId,
    stripe_subscription_id: resolvedSubscriptionId,
    subscription_status: status,
    trial_ends_at: trialEndsAt,
    is_active: subscriptionIsActive(status),
  }

  console.log(`[stripe:webhook] updating profile user_id=${userId}`)

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(update)
    .eq('id', userId)
    .select('id, email')

  if (error) {
    console.error(`[stripe:webhook] profile update failed for ${eventType}:`, error)
    throw error
  }

  if (!data || data.length === 0) {
    const message = `No profile found for user_id=${userId}, customer=${resolvedCustomerId || 'missing'}`
    console.error(`[stripe:webhook] profile update failed for ${eventType}: ${message}`)
    throw new Error(message)
  }

  console.log(
    `[stripe:webhook] profile update success for ${eventType}: profile=${data[0].id}, status=${status}, is_active=${update.is_active}`,
  )
}

async function updateFromSubscription(eventType, subscription) {
  const userId =
    typeof subscription.metadata?.user_id === 'string' ? subscription.metadata.user_id : undefined

  if (!userId) {
    throw new Error(
      `[stripe:webhook] ${eventType}: subscription ${subscription.id} is missing metadata.user_id; refusing to guess profile.`,
    )
  }

  await updateProfileSubscription({
    eventType,
    userId,
    customerId: subscription.customer,
    subscriptionId: subscription.id,
    status: subscription.status,
    trialEndsAt: timestampToIso(subscription.trial_end),
  })
}

async function updateFromInvoice(eventType, invoice, fallbackStatus) {
  const subscriptionId = stripeId(
    invoice.subscription ?? invoice.parent?.subscription_details?.subscription,
  )
  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    await updateFromSubscription(eventType, subscription)
    return
  }

  throw new Error(
    `[stripe:webhook] ${eventType}: invoice has no subscription id; cannot resolve metadata.user_id for profile update.`,
  )
}

app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    let event

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers['stripe-signature'],
        process.env.STRIPE_WEBHOOK_SECRET,
      )
    } catch (error) {
      console.error('Stripe webhook signature verification failed:', error.message)
      return res.status(400).send(`Webhook Error: ${error.message}`)
    }

    try {
      console.log(`[stripe:webhook] received event: ${event.type}`)

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object
          if (session.mode !== 'subscription' || !session.subscription) break

          const subscription = await stripe.subscriptions.retrieve(stripeId(session.subscription))
          const userId =
            (typeof session.metadata?.user_id === 'string' && session.metadata.user_id) ||
            (typeof subscription.metadata?.user_id === 'string' && subscription.metadata.user_id) ||
            (typeof session.client_reference_id === 'string' && session.client_reference_id) ||
            null
          if (!userId) {
            throw new Error(
              '[stripe:webhook] checkout.session.completed: missing user_id (metadata / client_reference_id) on session or subscription.',
            )
          }
          await updateProfileSubscription({
            eventType: event.type,
            userId,
            customerId: session.customer,
            subscriptionId: subscription.id,
            status: subscription.status,
            trialEndsAt: timestampToIso(subscription.trial_end),
          })
          break
        }
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          await updateFromSubscription(event.type, event.data.object)
          break
        }
        case 'invoice.paid': {
          await updateFromInvoice(event.type, event.data.object, 'active')
          break
        }
        case 'invoice.payment_failed': {
          await updateFromInvoice(event.type, event.data.object, 'past_due')
          break
        }
        default:
          break
      }

      return res.json({ received: true })
    } catch (error) {
      console.error(`Failed to handle Stripe webhook ${event.type}:`, error)
      return res.status(500).json({ error: 'Webhook handler failed.' })
    }
  },
)

app.use(cors({ origin: CLIENT_URL }))
app.use(express.json())

async function requireUser(req, res, next) {
  const authorization = req.headers.authorization || ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : ''

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token.' })
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data.user) {
    return res.status(401).json({ error: 'Invalid authorization token.' })
  }

  req.user = data.user
  return next()
}

async function getProfile(userId) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, stripe_customer_id')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

async function ensureStripeCustomer(profile) {
  if (profile.stripe_customer_id) return profile.stripe_customer_id

  const customer = await stripe.customers.create({
    email: profile.email,
    name: profile.full_name,
    metadata: {
      user_id: profile.id,
    },
  })

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', profile.id)

  if (error) throw error
  return customer.id
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/create-checkout-session', requireUser, async (req, res) => {
  try {
    const profile = await getProfile(req.user.id)
    const customerId = await ensureStripeCustomer(profile)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: req.user.id,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          user_id: req.user.id,
        },
      },
      metadata: {
        user_id: req.user.id,
      },
      allow_promotion_codes: true,
      success_url: appUrl('/billing?checkout=success'),
      cancel_url: appUrl('/billing?checkout=cancelled'),
    })

    console.log(`[stripe:checkout] created session for user_id=${req.user.id}`)
    return res.json({ url: session.url })
  } catch (error) {
    console.error('Failed to create checkout session:', error)
    return res.status(500).json({ error: 'Unable to create checkout session.' })
  }
})

app.post('/api/create-portal-session', requireUser, async (req, res) => {
  try {
    const profile = await getProfile(req.user.id)
    const customerId = await ensureStripeCustomer(profile)

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: appUrl('/billing'),
    })

    return res.json({ url: session.url })
  } catch (error) {
    console.error('Failed to create customer portal session:', error)
    return res.status(500).json({ error: 'Unable to open customer portal.' })
  }
})

app.post('/api/send-invite', requireUser, async (req, res) => {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    return res.status(503).json({ error: 'Email delivery is not configured (RESEND_API_KEY).' })
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const email =
    typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const employeeId = typeof body.employeeId === 'string' ? body.employeeId.trim() : ''
  const organizationId =
    typeof body.organizationId === 'string' ? body.organizationId.trim() : ''

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email address is required.' })
  }
  if (!employeeId || !organizationId) {
    return res.status(400).json({ error: 'employeeId and organizationId are required.' })
  }

  try {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('organization_id, role')
      .eq('id', req.user.id)
      .single()

    if (profileError || !profile) {
      return res.status(403).json({ error: 'Profile not found.' })
    }
    if (profile.organization_id !== organizationId || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to send invites for this organization.' })
    }

    const { data: employeeRow, error: employeeError } = await supabaseAdmin
      .from('employees')
      .select('id, organization_id, full_name')
      .eq('id', employeeId)
      .single()

    if (employeeError || !employeeRow || employeeRow.organization_id !== organizationId) {
      return res.status(400).json({ error: 'Employee not found for this organization.' })
    }

    const token = randomUUID().replaceAll('-', '')
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString()

    const insertRow = {
      organization_id: organizationId,
      employee_id: employeeId,
      token,
      contact_email: email,
      contact_phone: null,
      status: 'pending',
      invited_by: req.user.id,
      expires_at: expiresAt,
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('employee_invites')
      .insert(insertRow)
      .select('*')
      .single()

    if (insertError || !inserted) {
      console.error('[send-invite] insert failed:', insertError)
      return res.status(500).json({ error: 'Could not create invite.' })
    }

    const signupUrl = signupInviteUrl(token)
    const resend = new Resend(resendApiKey)
    const label = employeeRow.full_name?.trim() || 'there'

    try {
      const { error: sendError } = await resend.emails.send({
        from: RESEND_FROM_EMAIL,
        to: email,
        subject: `You're invited to join ${INVITE_APP_NAME}`,
        html: buildInviteEmailHtml({ signupUrl, inviteeLabel: label }),
      })

      if (sendError) {
        throw sendError
      }

      const { data: emailed, error: emailUpdateError } = await supabaseAdmin
        .from('employee_invites')
        .update({
          email_sent_at: new Date().toISOString(),
          email_send_error: null,
        })
        .eq('id', inserted.id)
        .select('*')
        .single()

      if (emailUpdateError || !emailed) {
        console.error('[send-invite] email_sent_at update failed:', emailUpdateError)
        return res.status(500).json({
          error: 'Invite email was sent but could not be confirmed in the database.',
          invite: mapEmployeeInviteRow(inserted),
          email_sent: true,
        })
      }

      return res.json({
        invite: mapEmployeeInviteRow(emailed),
        email_sent: true,
      })
    } catch (sendErr) {
      const msg =
        sendErr instanceof Error ? sendErr.message : String(sendErr ?? 'Unknown email error')

      const { data: failedRow } = await supabaseAdmin
        .from('employee_invites')
        .update({ email_send_error: msg })
        .eq('id', inserted.id)
        .select('*')
        .single()

      console.error('[send-invite] Resend failed:', sendErr)

      return res.status(502).json({
        error: msg,
        invite: mapEmployeeInviteRow(failedRow ?? inserted),
        email_sent: false,
      })
    }
  } catch (error) {
    console.error('Failed to send invite:', error)
    return res.status(500).json({ error: 'Unable to send invite.' })
  }
})

app.listen(PORT, () => {
  console.log(`StackLess billing server listening on http://localhost:${PORT}`)
})
