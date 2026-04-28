import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppData } from '../hooks/useAppData'
import { AssignJobModal } from '../components/employees/AssignJobModal'
import { PageContainer } from '../components/layout/PageContainer'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { EmployeeStatusBadge } from '../components/ui/Badge'
import { DAY_STATUS_LABEL } from '../lib/employeeDayScheduleDisplay'
import {
  aggregateTodaySummary,
  buildEmployeeTodayOverview,
  getCapacityLevel,
  type CapacityLevel,
  type EmployeeTodayOverview,
  type TodayOverviewKind,
} from '../lib/employeeTodayOverview'
import { formatISODate } from '../lib/format'
import { initialsFromName } from '../lib/initials'
import type { Employee, EmployeeAccountStatus, EmployeeInvite } from '../types'

const linkGhost =
  'inline-flex min-h-[40px] flex-1 items-center justify-center rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:shadow dark:border-slate-600 dark:bg-slate-800 dark:text-gray-200 dark:hover:border-slate-500 dark:hover:bg-slate-700 sm:flex-none sm:min-w-[7.5rem]'

const cardBase =
  'flex flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm shadow-slate-900/[0.03] transition dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20'

const cardActive =
  'hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:hover:border-slate-600 dark:hover:shadow-lg dark:hover:shadow-black/30'

function todayStatusAccent(kind: TodayOverviewKind): string {
  switch (kind) {
    case 'inactive':
      return 'border-slate-300/80 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/80'
    case 'conflict':
      return 'border-2 border-red-600 bg-red-50 ring-2 ring-red-500/25 dark:border-red-500 dark:bg-red-950/55 dark:ring-red-500/30'
    case 'working':
      return 'border-emerald-400/70 bg-emerald-50/90 dark:border-emerald-700/55 dark:bg-emerald-950/40'
    case 'available':
      return 'border-emerald-400/60 bg-emerald-50/80 dark:border-emerald-700/50 dark:bg-emerald-950/30'
    case 'off':
      return 'border-slate-300/80 bg-slate-100/90 dark:border-slate-600 dark:bg-slate-800/90'
    case 'vacation':
      return 'border-sky-400/65 bg-sky-50/95 dark:border-sky-700/55 dark:bg-sky-950/35'
    case 'sick':
      return 'border-rose-300/70 bg-rose-50/90 dark:border-rose-800/55 dark:bg-rose-950/35'
    case 'unavailable':
      return 'border-amber-300/70 bg-amber-50/90 dark:border-amber-800/55 dark:bg-amber-950/30'
  }
}

function StatusGlyph({ kind, conflict }: { kind: TodayOverviewKind; conflict: boolean }) {
  if (conflict || kind === 'conflict') {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white shadow-sm dark:bg-red-600" aria-hidden>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </span>
    )
  }
  switch (kind) {
    case 'available':
      return (
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300"
          aria-hidden
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      )
    case 'working':
      return (
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200"
          aria-hidden
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </span>
      )
    case 'inactive':
      return (
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
          aria-hidden
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </span>
      )
    default:
      return (
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
          aria-hidden
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </span>
      )
  }
}

function capacityPillClass(cap: CapacityLevel): string {
  switch (cap) {
    case 'available':
      return 'border-emerald-300/70 bg-emerald-50 text-emerald-900 dark:border-emerald-700/50 dark:bg-emerald-950/40 dark:text-emerald-100'
    case 'normal':
      return 'border-slate-200/90 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-200'
    case 'busy':
      return 'border-amber-300/80 bg-amber-50 text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-100'
    case 'alert':
      return 'border-red-400/90 bg-red-100 text-red-950 dark:border-red-700 dark:bg-red-950/50 dark:text-red-100'
    case 'away':
      return 'border-slate-300/80 bg-slate-100 text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-200'
    case 'inactive':
      return 'border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400'
  }
}

function capacityLabel(cap: CapacityLevel): string {
  switch (cap) {
    case 'available':
      return 'Open slot'
    case 'normal':
      return 'Normal load'
    case 'busy':
      return 'Heavy load'
    case 'alert':
      return 'Needs attention'
    case 'away':
      return 'Away'
    case 'inactive':
      return '—'
  }
}

function todayPrimaryLine(o: EmployeeTodayOverview): string {
  if (o.kind === 'inactive') return 'Inactive — not on active roster'
  if (o.kind === 'conflict') {
    return o.jobCount === 1
      ? 'Conflict — job on a day marked away'
      : `Conflict — ${o.jobCount} jobs on a day marked away`
  }
  if (o.kind === 'working') {
    return o.jobCount === 1 ? 'Working · 1 job today' : `Working · ${o.jobCount} jobs today`
  }
  if (o.kind === 'available') return 'Available – No jobs today'
  return DAY_STATUS_LABEL[o.kind]
}

function jobCountLine(o: EmployeeTodayOverview): string {
  if (o.kind === 'inactive' || o.kind === 'available') return ''
  if (o.jobCount === 0) return 'No jobs assigned today'
  return o.jobCount === 1 ? '1 job today' : `${o.jobCount} jobs today`
}

type Row = { employee: Employee; overview: EmployeeTodayOverview }

export function EmployeesPage() {
  const {
    employees,
    employeeInvites,
    jobs,
    employeeDaySchedules,
    addEmployee,
    updateEmployee,
    createEmployeeInvite,
    updateEmployeeInviteContact,
    refreshWorkspaceFromDb,
  } = useAppData()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignEmployee, setAssignEmployee] = useState<Employee | null>(null)
  const [inviteEmployee, setInviteEmployee] = useState<Employee | null>(null)

  const todayIso = useMemo(() => formatISODate(new Date()), [])

  const rows: Row[] = useMemo(() => {
    return employees.map((e) => ({
      employee: e,
      overview: buildEmployeeTodayOverview(
        e.status === 'active',
        e.id,
        todayIso,
        jobs,
        employeeDaySchedules,
      ),
    }))
  }, [employees, todayIso, jobs, employeeDaySchedules])

  const activeRows = useMemo(() => rows.filter((r) => r.employee.status === 'active'), [rows])
  const inactiveRows = useMemo(() => rows.filter((r) => r.employee.status !== 'active'), [rows])

  const overviews = useMemo(() => rows.map((r) => r.overview), [rows])
  const summary = useMemo(() => aggregateTodaySummary(overviews), [overviews])

  const startCreate = () => {
    setEditing(null)
    setOpen(true)
  }

  const startEdit = (e: Employee) => {
    setEditing(e)
    setOpen(true)
  }

  const openAssign = (e: Employee) => {
    setAssignEmployee(e)
    setAssignOpen(true)
  }

  const renderCard = (r: Row) => {
    const { employee: e, overview } = r
    const isActive = e.status === 'active'
    const conflict = overview.kind === 'conflict'
    const accent = todayStatusAccent(overview.kind)
    const cap = getCapacityLevel(overview)
    const preview = overview.jobsToday.slice(0, 3)
    const more = overview.jobCount > 3 ? overview.jobCount - 3 : 0
    const latestInvite = employeeInvites
      .filter((invite) => invite.employee_id === e.id)
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0]
    const inviteStatus = latestInvite?.status === 'accepted'
      ? 'Account linked'
      : latestInvite?.status === 'pending'
        ? 'Invite pending'
        : 'No account invite'

    return (
      <div
        key={e.id}
        className={`${cardBase} ${isActive ? cardActive : 'opacity-95'}`}
      >
        <div
          className={`rounded-xl border px-3 py-3 ${accent}`}
          role="status"
          aria-label={`Today for ${e.full_name}: ${todayPrimaryLine(overview)}`}
        >
          <div className="flex gap-3">
            <StatusGlyph kind={overview.kind} conflict={conflict} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-snug text-slate-900 dark:text-white">
                {todayPrimaryLine(overview)}
              </p>
              {jobCountLine(overview) ? (
                <p className="mt-0.5 text-xs font-medium text-slate-600 dark:text-gray-400">
                  {jobCountLine(overview)}
                </p>
              ) : null}
              {isActive && cap !== 'inactive' ? (
                <span
                  className={`mt-2 inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${capacityPillClass(cap)}`}
                >
                  {capacityLabel(cap)}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 text-sm font-semibold text-emerald-900 ring-1 ring-emerald-100/80 dark:from-emerald-900/50 dark:to-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800">
            {initialsFromName(e.full_name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-col items-start gap-2 min-[420px]:flex-row min-[420px]:justify-between">
              <div>
                <div className="break-words text-lg font-semibold leading-snug text-slate-900 dark:text-white">{e.full_name}</div>
                <div className="break-words text-sm text-slate-500 dark:text-gray-400">{e.role}</div>
              </div>
              <EmployeeStatusBadge status={e.status} />
            </div>
            {preview.length > 0 ? (
              <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                {preview.map((j) => (
                  <li
                    key={j.id}
                    className="text-sm font-medium leading-snug text-slate-800 dark:text-gray-200"
                    title={j.title}
                  >
                    <span className="tabular-nums text-slate-500 dark:text-slate-400">
                      {j.start_time}–{j.end_time}
                    </span>{' '}
                    <span className="text-slate-900 dark:text-gray-100">{j.title}</span>
                  </li>
                ))}
                {more > 0 ? (
                  <li className="text-xs font-medium text-slate-500 dark:text-gray-500">+{more} more today</li>
                ) : null}
              </ul>
            ) : null}
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500 dark:text-gray-400">Phone</dt>
                <dd className="text-right text-slate-800 dark:text-gray-200">{e.phone || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500 dark:text-gray-400">Email</dt>
                <dd className="text-right text-slate-800 dark:text-gray-200">{e.email || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500 dark:text-gray-400">Availability</dt>
                <dd className="text-right text-slate-800 dark:text-gray-200">{e.availability || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500 dark:text-gray-400">Crew account</dt>
                <dd className="text-right text-slate-800 dark:text-gray-200">{inviteStatus}</dd>
              </div>
            </dl>
            {e.notes ? (
              <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800/80 dark:text-gray-300">
                {e.notes}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <Button
            type="button"
            className="min-h-[42px] flex-1 font-semibold sm:flex-none sm:min-w-[9rem]"
            disabled={!isActive}
            title={!isActive ? 'Activate this employee before assigning jobs' : undefined}
            onClick={() => isActive && openAssign(e)}
          >
            Manage crew
          </Button>
          <Link
            className={linkGhost}
            to={`/jobs?employee=${encodeURIComponent(e.id)}&from=${encodeURIComponent(todayIso)}&to=${encodeURIComponent(todayIso)}`}
          >
            Jobs list
          </Link>
          <Link className={linkGhost} to={`/calendar?showEmployee=${encodeURIComponent(e.id)}`}>
            Schedule
          </Link>
          <Button variant="secondary" className="min-h-[42px] flex-1 sm:flex-none" onClick={() => startEdit(e)}>
            Edit
          </Button>
          <Button
            variant="secondary"
            className="min-h-[42px] flex-1 sm:flex-none"
            onClick={() => setInviteEmployee(e)}
          >
            Invite
          </Button>
        </div>
      </div>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Team"
        description="Today’s load, conflicts, and open slots — assign work in one tap from each card."
        action={
          <Button type="button" onClick={startCreate}>
            Add employee
          </Button>
        }
      />

      {employees.length > 0 ? (
        <section
          className="mb-6 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm dark:border-[#1F2A36] dark:bg-[#11161D] sm:p-5"
          aria-label="Team status today"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-[#94A3B8]">
            Today · {todayIso}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 sm:gap-3">
            <div className="inline-flex items-center gap-2 rounded-[14px] border border-emerald-200/80 bg-emerald-50/90 px-3 py-2 dark:border-emerald-500/25 dark:bg-emerald-500/10">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden />
              <span className="text-sm font-semibold text-emerald-950 dark:text-emerald-100">Working</span>
              <span className="text-sm font-bold tabular-nums text-emerald-800 dark:text-emerald-200">
                {summary.working}
              </span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-[14px] border border-blue-200/80 bg-blue-50/80 px-3 py-2 dark:border-blue-500/25 dark:bg-blue-500/10">
              <span className="h-2.5 w-2.5 rounded-full border-2 border-blue-500 bg-blue-100" aria-hidden />
              <span className="text-sm font-semibold text-blue-900 dark:text-blue-200">Available</span>
              <span className="text-sm font-bold tabular-nums text-blue-800 dark:text-blue-200">
                {summary.available}
              </span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2 dark:border-[#1F2A36] dark:bg-[#151B23]">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400" aria-hidden />
              <span className="text-sm font-semibold text-slate-800 dark:text-gray-200">Away</span>
              <span className="text-sm font-bold tabular-nums text-slate-700 dark:text-gray-300">
                {summary.away}
              </span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-[14px] border border-red-400/70 bg-red-50 px-3 py-2 dark:border-red-500/35 dark:bg-red-500/10">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-red-600 text-[10px] font-bold text-white" aria-hidden>
                !
              </span>
              <span className="text-sm font-bold text-red-950 dark:text-red-100">Conflicts</span>
              <span className="text-sm font-bold tabular-nums text-red-800 dark:text-red-200">
                {summary.conflicts}
              </span>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-[#94A3B8]">
            Available = working day, no jobs yet. Conflict = job booked on a marked-away day.
          </p>
        </section>
      ) : null}

      {activeRows.length > 0 ? (
        <div className="mb-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-gray-400">
            Active crew
          </h2>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">{activeRows.map(renderCard)}</div>

      {inactiveRows.length > 0 ? (
        <details className="group mt-10 rounded-2xl border border-dashed border-slate-200/90 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
          <summary className="cursor-pointer list-none text-sm font-semibold text-slate-700 outline-none marker:content-none dark:text-gray-300 [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              Inactive ({inactiveRows.length})
              <span className="text-xs font-normal text-slate-500 dark:text-gray-500">
                — tap to expand
              </span>
            </span>
          </summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">{inactiveRows.map(renderCard)}</div>
        </details>
      ) : null}

      {employees.length === 0 ? (
        <EmptyState
          title="No crew added"
          detail="Add crew members to assign them to jobs"
          action={<Button onClick={startCreate}>Add crew member</Button>}
        />
      ) : null}

      {open ? (
        <EmployeeModal
          key={editing?.id ?? 'new'}
          initial={editing}
          onClose={() => setOpen(false)}
          onSave={(payload) => {
            if (editing) updateEmployee(editing.id, payload)
            else addEmployee(payload)
            setOpen(false)
          }}
        />
      ) : null}

      {assignOpen && assignEmployee ? (
        <AssignJobModal
          key={assignEmployee.id}
          open={assignOpen}
          employee={assignEmployee}
          onClose={() => {
            setAssignOpen(false)
            setAssignEmployee(null)
          }}
        />
      ) : null}

      {inviteEmployee ? (
        <EmployeeInviteModal
          key={inviteEmployee.id}
          /* Remount per employee so invite form state (email/phone) always starts empty. */
          employee={inviteEmployee}
          latestInvite={
            employeeInvites
              .filter((invite) => invite.employee_id === inviteEmployee.id)
              .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0] ?? null
          }
          onCreateInvite={createEmployeeInvite}
          onUpdateInviteContact={updateEmployeeInviteContact}
          onRefreshWorkspace={refreshWorkspaceFromDb}
          onClose={() => setInviteEmployee(null)}
        />
      ) : null}
    </PageContainer>
  )
}

/** Production origin for copied invite URLs (must match deployed hash-router base). */
const INVITE_LINK_ORIGIN = 'https://stack-less.vercel.app'

function inviteLinkFor(token: string) {
  const base = INVITE_LINK_ORIGIN.replace(/\/$/, '')
  return `${base}/#/signup?invite=${encodeURIComponent(token)}`
}

const INVITE_NEXT_STEP_CALLOUT =
  'Next step: Copy this link and send it to the employee via text or email so they can create their account.'

function EmployeeInviteModal({
  employee,
  latestInvite,
  onCreateInvite,
  onUpdateInviteContact,
  onRefreshWorkspace,
  onClose,
}: {
  employee: Employee
  latestInvite: EmployeeInvite | null
  onCreateInvite: (
    employeeId: string,
    input: { contact_email?: string; contact_phone?: string },
  ) => Promise<EmployeeInvite>
  onUpdateInviteContact: (
    inviteId: string,
    input: { contact_email?: string; contact_phone?: string },
  ) => Promise<EmployeeInvite>
  onRefreshWorkspace: () => Promise<void>
  onClose: () => void
}) {
  const [inviteEmail, setInviteEmail] = useState(() => employee.email?.trim() || '')
  const [invitePhone, setInvitePhone] = useState(() => employee.phone?.trim() || '')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copyBusy, setCopyBusy] = useState(false)

  const invite = latestInvite
  const inviteLink = invite ? inviteLinkFor(invite.token) : null

  async function handleCopyLink() {
    setError(null)
    setCopied(false)
    setCopyBusy(true)
    try {
      const contactEmail = inviteEmail.trim() || undefined
      const contactPhone = invitePhone.trim() || undefined

      if (!invite?.token) {
        const created = await onCreateInvite(employee.id, {
          contact_email: contactEmail,
          contact_phone: contactPhone,
        })
        await navigator.clipboard.writeText(inviteLinkFor(created.token))
      } else {
        await onUpdateInviteContact(invite.id, {
          contact_email: contactEmail,
          contact_phone: contactPhone,
        })
        await navigator.clipboard.writeText(inviteLinkFor(invite.token))
      }
      setCopied(true)
      await onRefreshWorkspace()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to copy invite link.')
    } finally {
      setCopyBusy(false)
    }
  }

  return (
    <Modal
      open
      title={`Invite ${employee.full_name}`}
      description="Email and phone are prefilled from this employee when available. Edit them if needed, then copy the link."
      onClose={onClose}
      footer={
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleCopyLink} disabled={copyBusy}>
            {copied
              ? 'Link Copied — Send it to employee'
              : copyBusy
                ? 'Preparing…'
                : 'Copy & Send Link'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-xs leading-relaxed text-slate-500 dark:text-gray-400">
          Values save to this invite when you copy the link (for tracking). Leave blank if unknown.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="employee-invite-email"
            name="inviteEmail"
            autoComplete="email"
            label="Email (optional)"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="crew@example.com"
          />
          <Input
            id="employee-invite-phone"
            name="invitePhone"
            autoComplete="tel"
            label="Phone (optional)"
            type="tel"
            value={invitePhone}
            onChange={(e) => setInvitePhone(e.target.value)}
            placeholder="(555) 123-4567"
          />
        </div>

        {error ? (
          <p className="rounded-[14px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </p>
        ) : null}

        {invite ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {invite.status === 'accepted' ? 'Invite accepted' : 'Signup link'}
            </p>
            {inviteLink ? (
              <>
                <div
                  className="mt-3 rounded-[14px] border border-blue-200 bg-blue-50/95 px-3.5 py-2.5 text-xs leading-relaxed text-blue-950 shadow-sm shadow-blue-900/[0.04] dark:border-blue-500/35 dark:bg-blue-500/10 dark:text-blue-50 dark:shadow-none"
                  role="status"
                >
                  {INVITE_NEXT_STEP_CALLOUT}
                </div>
                <div className="mt-3">
                  <input
                    className="min-h-11 w-full rounded-[14px] border border-slate-200 bg-white px-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-gray-200"
                    value={inviteLink}
                    readOnly
                    aria-label="Signup invite URL"
                  />
                </div>
              </>
            ) : null}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
            <div
              className="rounded-[14px] border border-blue-200 bg-blue-50/95 px-3.5 py-2.5 text-xs leading-relaxed text-blue-950 shadow-sm shadow-blue-900/[0.04] dark:border-blue-500/35 dark:bg-blue-500/10 dark:text-blue-50 dark:shadow-none"
              role="status"
            >
              Use <strong className="font-semibold">Copy & Send Link</strong> below to create the invite URL.
              Then send it to your employee by text or email so they can sign up.
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

function EmployeeModal({
  initial,
  onClose,
  onSave,
}: {
  initial: Employee | null
  onClose: () => void
  onSave: (e: Omit<Employee, 'id'>) => void
}) {
  const [values, setValues] = useState<Omit<Employee, 'id'>>(() =>
    initial
      ? {
          full_name: initial.full_name,
          phone: initial.phone,
          email: initial.email,
          role: initial.role,
          availability: initial.availability,
          status: initial.status,
          notes: initial.notes,
        }
      : {
          full_name: '',
          phone: '',
          email: '',
          role: 'Technician',
          availability: '',
          status: 'active',
          notes: '',
        },
  )

  const set = (patch: Partial<Omit<Employee, 'id'>>) =>
    setValues((v) => ({ ...v, ...patch }))

  return (
    <Modal
      open
      title={initial ? 'Edit employee' : 'New employee'}
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!values.full_name.trim()) return
              onSave(values)
            }}
          >
            Save team member
          </Button>
        </>
      }
    >
      <p className="mb-5 text-sm text-slate-600">
        Active members appear in job assignment dropdowns; inactive stay on file.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Full name"
          value={values.full_name}
          onChange={(e) => set({ full_name: e.target.value })}
          required
        />
        <Input
          label="Phone"
          value={values.phone}
          onChange={(e) => set({ phone: e.target.value })}
        />
        <Input
          label="Email"
          type="email"
          value={values.email}
          onChange={(e) => set({ email: e.target.value })}
        />
        <Input
          label="Role"
          value={values.role}
          onChange={(e) => set({ role: e.target.value })}
        />
        <Input
          label="Availability"
          value={values.availability}
          onChange={(e) => set({ availability: e.target.value })}
          placeholder="Availability"
        />
        <Select
          label="Status"
          value={values.status}
          onChange={(e) => set({ status: e.target.value as EmployeeAccountStatus })}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
        <div className="sm:col-span-2">
          <Textarea
            label="Notes"
            value={values.notes}
            onChange={(e) => set({ notes: e.target.value })}
          />
        </div>
      </div>
    </Modal>
  )
}
