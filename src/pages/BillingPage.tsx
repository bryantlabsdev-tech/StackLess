import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageContainer } from '../components/layout/PageContainer'
import { Button } from '../components/ui/Button'
import { createCheckoutSession, createPortalSession } from '../lib/billing'
import { formatTrialEnd } from '../lib/subscription'
import { useAuth } from '../hooks/useAuth'

export function BillingPage() {
  const { user, refreshProfile, workspaceSubscriptionAccess } = useAuth()
  const [searchParams] = useSearchParams()
  const [loadingAction, setLoadingAction] = useState<'checkout' | 'portal' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get('checkout') !== 'success') return

    const timer = window.setTimeout(() => {
      void refreshProfile().then(() => {
        setMessage('Subscription status refreshed.')
      })
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [refreshProfile, searchParams])

  async function openCheckout() {
    setError(null)
    setLoadingAction('checkout')
    try {
      window.location.assign(await createCheckoutSession())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start trial.')
      setLoadingAction(null)
    }
  }

  async function openPortal() {
    setError(null)
    setLoadingAction('portal')
    try {
      window.location.assign(await createPortalSession())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to open billing portal.')
      setLoadingAction(null)
    }
  }

  const hasAccess = workspaceSubscriptionAccess === true
  const trialEnd = formatTrialEnd(user)
  const statusMessage =
    message ??
    (searchParams.get('checkout') === 'success'
      ? 'Checkout completed. Syncing subscription status...'
      : null)

  return (
    <PageContainer>
      <section className="mx-auto max-w-2xl rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-900/5 dark:border-[#1F2A36] dark:bg-[#11161D]">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
            StackLess Billing
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950 dark:text-[#F8FAFC]">
            Start your 7-day free trial
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-[#94A3B8]">
            Keep using StackLess with a monthly subscription after your trial. You can update payment
            details or cancel from the customer portal at any time.
          </p>
        </div>

        <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 dark:border-[#1F2A36] dark:bg-[#0B0F14]">
          <div className="text-sm font-semibold text-slate-950 dark:text-[#F8FAFC]">
            Current status: {user?.subscription_status ?? 'not started'}
          </div>
          {trialEnd ? (
            <p className="mt-1 text-sm text-slate-500 dark:text-[#94A3B8]">Trial ends {trialEnd}</p>
          ) : null}
          <p className="mt-1 text-sm text-slate-500 dark:text-[#94A3B8]">
            {hasAccess
              ? 'Your subscription is active and app access is enabled.'
              : 'Start a trial to unlock the app.'}
          </p>
        </div>

        {statusMessage ? (
          <p className="mt-4 rounded-[14px] border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
            {statusMessage}
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-[14px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button type="button" onClick={openCheckout} disabled={loadingAction !== null}>
            {loadingAction === 'checkout' ? 'Opening checkout...' : 'Start Free Trial'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={openPortal}
            disabled={loadingAction !== null}
          >
            {loadingAction === 'portal' ? 'Opening portal...' : 'Manage Subscription'}
          </Button>
        </div>
      </section>
    </PageContainer>
  )
}
