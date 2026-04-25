import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { safePostLoginPath } from '../auth/routeAccess'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'

export function SignupPage() {
  const { user, signup } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    return <Navigate to={safePostLoginPath(undefined, user.role)} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setError(null)
    setSubmitting(true)

    try {
      const result = await signup(email, password)
      if (result.session && result.profile) {
        navigate(safePostLoginPath(undefined, result.profile.role), { replace: true })
        return
      }
      if (result.session) {
        setMessage('Account created. Your profile is still syncing, so please sign in again in a moment.')
        return
      }
      setMessage('Account created. Check your email to confirm your address, then sign in.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create your account.')
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
            Create your StackLess account
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-[#94A3B8]">
            Start managing your schedule, jobs, customers, and team.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            id="signup-email"
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <Input
            id="signup-password"
            label="Password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />

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

          <Button className="w-full" type="submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-[#94A3B8]">
          Already have an account?{' '}
          <Link className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-300" to="/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  )
}
