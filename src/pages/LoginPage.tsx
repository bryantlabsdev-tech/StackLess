import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { safePostLoginPath } from '../auth/routeAccess'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'

function getRedirectPath(state: unknown, role: 'admin' | 'employee') {
  const from = state as { from?: { pathname?: string } } | null
  return safePostLoginPath(from?.from?.pathname, role)
}

export function LoginPage() {
  const { user, login, acceptInvite } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inviteToken = searchParams.get('invite')?.trim() || undefined
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    return <Navigate to={safePostLoginPath(undefined, user.role)} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      let profile = await login(email, password)
      if (inviteToken) profile = await acceptInvite(inviteToken)
      navigate(getRedirectPath(location.state, profile.role), { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-xl shadow-slate-900/10 backdrop-blur dark:border-[#1F2A36] dark:bg-[#0B0F14]/90">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500 text-sm font-bold tracking-tight text-white shadow-lg shadow-blue-950/20">
            SL
          </div>
          <h1 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-[#F8FAFC]">
            Sign in to StackLess
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-[#94A3B8]">
            {inviteToken
              ? 'Sign in to accept your crew invite and link your employee profile.'
              : 'Access your jobs, customers, schedule, and team dashboard.'}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            id="login-email"
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          {inviteToken ? (
            <p className="rounded-[14px] border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-sm text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
              This sign-in will accept a crew invite and connect your account to the assigned employee record.
            </p>
          ) : null}
          <Input
            id="login-password"
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {error ? (
            <p className="rounded-[14px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              {error}
            </p>
          ) : null}

          <Button className="w-full" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-[#94A3B8]">
          New to StackLess?{' '}
          <Link
            className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-300"
            to={inviteToken ? `/signup?invite=${encodeURIComponent(inviteToken)}` : '/signup'}
          >
            Create an account
          </Link>
        </p>
      </section>
    </main>
  )
}
