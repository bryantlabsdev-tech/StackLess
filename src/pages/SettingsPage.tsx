import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageContainer } from '../components/layout/PageContainer'
import { ThemeToggle } from '../components/layout/ThemeToggle'
import { Button } from '../components/ui/Button'
import { createPortalSession } from '../lib/billing'
import { formatTrialEnd } from '../lib/subscription'
import { useAuth } from '../hooks/useAuth'
import { useOnboarding } from '../context/onboardingContext'

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/5 dark:border-[#1F2A36] dark:bg-[#11161D] sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-950 dark:text-[#F8FAFC]">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-[#94A3B8]">{description}</p>
      </div>
      {children}
    </section>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 dark:border-[#1F2A36] dark:bg-[#0B0F14] sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
        {label}
      </span>
      <span className="break-words text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">
        {value}
      </span>
    </div>
  )
}

export function SettingsPage() {
  const { user, logout, refreshProfile, workspaceSubscriptionAccess } = useAuth()
  const onboarding = useOnboarding()
  const navigate = useNavigate()
  const [loadingAction, setLoadingAction] = useState<'portal' | 'refresh' | 'signout' | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSignOut() {
    setLoadingAction('signout')
    await logout()
    navigate('/login', { replace: true })
  }

  async function handleManageSubscription() {
    setError(null)
    setLoadingAction('portal')
    try {
      window.location.assign(await createPortalSession())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to open the billing portal.')
      setLoadingAction(null)
    }
  }

  async function handleRefreshSubscription() {
    setError(null)
    setMessage(null)
    setLoadingAction('refresh')
    try {
      await refreshProfile()
      setMessage('Subscription status refreshed.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to refresh subscription status.')
    } finally {
      setLoadingAction(null)
    }
  }

  const subscriptionStatus = user?.subscription_status ?? 'not started'
  const trialEnd = formatTrialEnd(user)
  const hasAccess = workspaceSubscriptionAccess === true

  return (
    <PageContainer>
      <div className="mx-auto w-full max-w-4xl space-y-5 sm:space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
            Settings
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950 dark:text-[#F8FAFC]">
            Manage StackLess
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-[#94A3B8]">
            Review your account, subscription, and app preferences.
          </p>
        </div>

        <SettingsCard title="Account" description="Your signed-in StackLess profile.">
          <div className="space-y-3">
            <DetailRow label="Email" value={user?.email ?? 'Unavailable'} />
            <DetailRow label="Role" value={user?.role ?? 'Unavailable'} />
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={handleSignOut}
              disabled={loadingAction !== null}
            >
              {loadingAction === 'signout' ? 'Signing out...' : 'Sign out'}
            </Button>
          </div>
        </SettingsCard>

        <SettingsCard
          title="Subscription"
          description="Manage your trial, monthly plan, and payment details."
        >
          <div className="space-y-3">
            <DetailRow label="Status" value={subscriptionStatus} />
            {trialEnd ? <DetailRow label="Trial ends" value={trialEnd} /> : null}

            {message ? (
              <p className="rounded-[14px] border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                {message}
              </p>
            ) : null}

            {error ? (
              <p className="rounded-[14px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                {error}
              </p>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                type="button"
                onClick={handleManageSubscription}
                disabled={loadingAction !== null}
              >
                {loadingAction === 'portal' ? 'Opening portal...' : 'Manage Subscription'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleRefreshSubscription}
                disabled={loadingAction !== null}
              >
                {loadingAction === 'refresh' ? 'Refreshing...' : 'Refresh Subscription Status'}
              </Button>
              {!hasAccess ? (
                <Link
                  to="/billing"
                  className="inline-flex min-h-11 touch-manipulation items-center justify-center rounded-[14px] border border-blue-400/60 bg-blue-500 px-4 py-2.5 text-sm font-semibold tracking-[-0.01em] text-white shadow-lg shadow-blue-950/20 transition-all duration-200 hover:-translate-y-px hover:bg-blue-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70"
                >
                  Start Free Trial
                </Link>
              ) : null}
            </div>
          </div>
        </SettingsCard>

        <SettingsCard title="Appearance" description="Choose how StackLess looks on this device.">
          <div className="max-w-xs">
            <ThemeToggle />
          </div>
        </SettingsCard>

        {user?.role === 'admin' && onboarding ? (
          <SettingsCard
            title="Guided tour"
            description="Replay the short walkthrough of customers, jobs, crew assignment, and the crew mobile experience."
          >
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => onboarding.replayTour()}
            >
              Replay guided tour
            </Button>
          </SettingsCard>
        ) : null}
      </div>
    </PageContainer>
  )
}
