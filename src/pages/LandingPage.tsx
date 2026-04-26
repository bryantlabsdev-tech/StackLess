import { Link } from 'react-router-dom'

const features = [
  {
    title: 'Scheduling',
    description: 'Plan the day, assign work, and keep the whole crew aligned from one calendar.',
  },
  {
    title: 'Customers',
    description: 'Keep client details, service addresses, and job history close to the work.',
  },
  {
    title: 'Notes',
    description: 'Capture job details, customer requests, and follow-ups without scattered reminders.',
  },
  {
    title: 'Photos',
    description: 'Document work, attach proof, and keep before-and-after context with each job.',
  },
] as const

function TrialButton({ className = '' }: { className?: string }) {
  return (
    <Link
      to="/signup"
      className={`inline-flex min-h-12 touch-manipulation items-center justify-center rounded-[16px] border border-blue-300/70 bg-blue-500 px-6 py-3 text-sm font-semibold tracking-[-0.01em] text-white shadow-xl shadow-blue-950/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/80 ${className}`}
    >
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

      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between py-3">
          <Link to="/" className="flex items-center gap-3" aria-label="StackLess home">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-300/30 bg-blue-500 text-sm font-bold tracking-tight text-white shadow-lg shadow-blue-950/30">
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

        <section className="flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center py-20 text-center sm:py-24">
          <div className="mb-6 inline-flex rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200 shadow-2xl shadow-black/20 backdrop-blur">
            Business command center
          </div>
          <h1 className="max-w-5xl text-5xl font-semibold tracking-[-0.075em] text-white sm:text-6xl lg:text-7xl">
            Run your entire business from one simple app.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
            Jobs, scheduling, customers, notes, and photos — all in one place.
          </p>
          <div className="mt-9 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
            <TrialButton className="w-full sm:w-auto" />
            <Link
              to="/login"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-[16px] border border-white/10 bg-white/[0.06] px-6 py-3 text-sm font-semibold text-slate-200 shadow-lg shadow-black/15 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/[0.1] sm:w-auto"
            >
              I already have an account
            </Link>
          </div>
        </section>

        <section className="grid gap-5 py-16 md:grid-cols-[0.9fr_1.1fr] md:items-center md:py-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-300">
              The problem
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.055em] text-white sm:text-5xl">
              Too many apps slows down the work.
            </h2>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/20 backdrop-blur sm:p-8">
            <p className="text-base leading-8 text-slate-300">
              Running a service business often means juggling a calendar, spreadsheets, text
              messages, photo folders, customer notes, and payment tools. StackLess brings the daily
              workflow into one focused app so your team spends less time switching tabs and more
              time finishing jobs.
            </p>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-300">
                Features
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.055em] text-white sm:text-5xl">
                Everything your crew needs.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-400">
              Clean tools for the work that happens every day, built to stay simple as you grow.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-[24px] border border-white/10 bg-white/[0.055] p-5 shadow-xl shadow-black/15 backdrop-blur transition hover:-translate-y-1 hover:border-blue-300/30 hover:bg-white/[0.08]"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-300/20 bg-blue-500/15 text-sm font-bold text-blue-200">
                  {feature.title.slice(0, 2)}
                </div>
                <h3 className="text-lg font-semibold tracking-[-0.03em] text-white">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-white/[0.1] via-white/[0.055] to-blue-500/[0.08] p-6 shadow-2xl shadow-black/25 backdrop-blur sm:p-10 lg:p-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-300">
                  Value
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.055em] text-white sm:text-5xl">
                  Replace the stack. Keep the workflow.
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
                  Instead of paying for multiple subscriptions and stitching them together, StackLess
                  gives your business one simple place to manage the work. Fewer tools, fewer logins,
                  less confusion.
                </p>
              </div>
              <div className="grid gap-3">
                {['One app for daily operations', 'Lower software clutter', 'Simple enough for the whole crew'].map(
                  (item) => (
                    <div
                      key={item}
                      className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-4 text-sm font-semibold text-slate-200"
                    >
                      {item}
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 pb-24 text-center md:py-24 md:pb-28">
          <div className="mx-auto max-w-3xl rounded-[32px] border border-white/10 bg-white/[0.06] p-7 shadow-2xl shadow-black/25 backdrop-blur sm:p-10">
            <h2 className="text-3xl font-semibold tracking-[-0.055em] text-white sm:text-5xl">
              Ready to simplify your workflow?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-300">
              Start with the core tools your business needs and keep everything moving in one place.
            </p>
            <div className="mt-8">
              <TrialButton className="w-full sm:w-auto" />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
