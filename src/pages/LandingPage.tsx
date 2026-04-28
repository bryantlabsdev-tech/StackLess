import { Link } from 'react-router-dom'
import { TESTFLIGHT_URL } from '../lib/testflight'

const valueStack = [
  'Every crew member gets their own login (no more texting jobs)',
  'Assign work and track progress in real time',
  'Require photos before jobs are marked complete',
  'See exactly what your team is doing today',
  'Replace spreadsheets, notes, and group chats',
] as const

const howItWorks = [
  {
    title: 'Create jobs',
    detail: 'Assign work to your crew instantly',
  },
  {
    title: 'Crew logs in',
    detail: 'They see assigned jobs and update progress',
  },
  {
    title: 'Get it done',
    detail: 'Photos, notes, and completion tracked',
  },
] as const

const primaryCtaClass =
  'inline-flex min-h-12 touch-manipulation items-center justify-center rounded-[16px] border border-blue-300/70 bg-blue-500 px-6 py-3 text-sm font-semibold tracking-[-0.01em] text-white shadow-xl shadow-blue-950/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/80'

/** Larger hero trial CTA — reads as the dominant action */
const heroPrimaryCtaClass =
  'inline-flex min-h-[3.25rem] w-full touch-manipulation items-center justify-center rounded-[18px] border border-blue-300/70 bg-blue-500 px-8 py-4 text-base font-semibold tracking-[-0.02em] text-white shadow-2xl shadow-blue-950/40 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/90 sm:min-h-14'

const secondaryCtaClass =
  'inline-flex min-h-12 touch-manipulation items-center justify-center rounded-[16px] border border-white/10 bg-white/[0.06] px-6 py-3 text-sm font-semibold text-slate-200 shadow-lg shadow-black/15 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/[0.1] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/70'

function TrialButton({
  className = '',
  variant = 'default',
}: {
  className?: string
  variant?: 'default' | 'hero'
}) {
  const base = variant === 'hero' ? heroPrimaryCtaClass : primaryCtaClass
  return (
    <Link to="/signup" className={`${base} ${className}`}>
      Start Free Trial
    </Link>
  )
}

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#05080D] text-white">
      <div className="pointer-events-none fixed inset-0" aria-hidden>
        <div className="absolute left-1/2 top-[-18rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute right-[-12rem] top-1/3 h-[28rem] w-[28rem] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-[-18rem] left-[-10rem] h-[30rem] w-[30rem] rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-3xl flex-col px-4 py-5 sm:max-w-5xl sm:px-6 lg:max-w-6xl lg:px-8">
        <header className="flex items-center justify-between py-3">
          <Link to="/" className="flex items-center gap-3" aria-label="StackLess home">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-300/30 bg-blue-500 text-sm font-bold tracking-tight text-white shadow-lg shadow-blue-950/30 sm:h-11 sm:w-11">
              SL
            </span>
            <span className="text-base font-semibold tracking-[-0.03em] text-white">StackLess</span>
          </Link>
          <Link
            to="/login"
            className="rounded-full px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            Sign in
          </Link>
        </header>

        {/* Above the fold: headline → subtext → value → CTAs */}
        <section className="pb-16 pt-8 text-center sm:pb-20 sm:pt-10">
          <h1 className="text-4xl font-semibold tracking-[-0.07em] text-white sm:text-5xl lg:text-6xl">
            The operating system for service businesses.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Manage jobs, crew, customers, and photos — all in one place.
          </p>

          <ul
            className="mx-auto mt-10 max-w-xl space-y-3 text-left text-sm text-slate-200 sm:text-[15px] md:text-base"
            role="list"
          >
            {valueStack.map((line) => (
              <li key={line} className="flex gap-3">
                <span className="shrink-0 pt-0.5 text-emerald-400" aria-hidden>
                  ✔
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <p className="mx-auto mt-10 max-w-xl text-lg font-semibold leading-snug tracking-[-0.02em] text-white sm:text-xl">
            Stop chasing your crew. Know what&apos;s getting done — instantly.
          </p>

          <div className="mx-auto mt-12 flex w-full max-w-md flex-col items-center">
            <TrialButton variant="hero" />

            <div className="mt-8 w-full text-center">
              <p className="text-base font-semibold tracking-[-0.02em] text-slate-100 sm:text-lg">
                Founding member pricing — $24.99/month
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Get in early and grow with the product
              </p>
              <p className="mt-4 text-sm leading-relaxed text-slate-400">
                Most teams replace 3–5 tools with StackLess
              </p>
            </div>

            <p className="mt-12 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              or
            </p>

            <div className="mt-6 w-full rounded-[20px] border border-white/10 bg-white/[0.04] px-5 py-6 text-center shadow-lg shadow-black/20 backdrop-blur sm:px-6 sm:py-7">
              <p className="text-sm font-semibold text-slate-200">Run it from the field</p>
              <a
                href={TESTFLIGHT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`${secondaryCtaClass} mt-4 w-full`}
              >
                Download for iOS
              </a>
              <p className="mt-3 text-xs leading-relaxed text-slate-500 sm:text-sm">
                Run your entire business from your phone
              </p>
            </div>
          </div>

          <p className="mx-auto mt-12 max-w-xl text-sm leading-relaxed text-slate-400">
            Your crew doesn&apos;t need training — they just log in and see their jobs.
          </p>
        </section>

        {/* How it works — single compact section */}
        <section className="border-t border-white/10 py-16 sm:py-20">
          <h2 className="text-center text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">
            How it works
          </h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-10">
            {howItWorks.map((step, i) => (
              <li key={step.title} className="text-center sm:text-left">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300/90">
                  {i + 1}
                </span>
                <p className="mt-2 text-lg font-semibold text-white">{step.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{step.detail}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* iOS — field usage */}
        <section className="border-t border-white/10 pb-20 pt-16 sm:pb-24 sm:pt-20">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-8 text-center sm:px-10 sm:py-10">
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">
              Run your business from the field
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-slate-400 sm:text-base">
              Manage jobs, track your crew, upload photos, and complete work — all from your phone.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
