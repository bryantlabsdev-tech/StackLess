import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const PORT = process.env.SERVER_PORT || 4242
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL

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

function subscriptionIsActive(status) {
  return status === 'active' || status === 'trialing'
}

function timestampToIso(timestamp) {
  return timestamp ? new Date(timestamp * 1000).toISOString() : null
}

async function updateProfileSubscription({
  userId,
  customerId,
  subscriptionId,
  status,
  trialEndsAt,
}) {
  const update = {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    subscription_status: status,
    trial_ends_at: trialEndsAt,
    is_active: subscriptionIsActive(status),
  }

  let query = supabaseAdmin.from('profiles').update(update)
  query = userId ? query.eq('id', userId) : query.eq('stripe_customer_id', customerId)

  const { error } = await query
  if (error) throw error
}

async function updateFromSubscription(subscription) {
  const userId =
    typeof subscription.metadata?.user_id === 'string' ? subscription.metadata.user_id : undefined

  await updateProfileSubscription({
    userId,
    customerId: subscription.customer,
    subscriptionId: subscription.id,
    status: subscription.status,
    trialEndsAt: timestampToIso(subscription.trial_end),
  })
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
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object
          if (session.mode !== 'subscription' || !session.subscription) break

          const subscription = await stripe.subscriptions.retrieve(session.subscription)
          await updateProfileSubscription({
            userId: session.client_reference_id || session.metadata?.user_id,
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
          await updateFromSubscription(event.data.object)
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

app.listen(PORT, () => {
  console.log(`StackLess billing server listening on http://localhost:${PORT}`)
})
