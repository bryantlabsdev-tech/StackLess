import { useMemo, useState } from 'react'
import { useAppData } from '../../hooks/useAppData'
import { CustomerFieldsForm, emptyCustomerDraft } from '../customers/CustomerFieldsForm'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'
import type { Customer, Employee, Job, JobStatus } from '../../types'
import { JOB_STATUS_LABELS } from '../../types'

const STATUSES: JobStatus[] = [
  'unassigned',
  'scheduled',
  'in_progress',
  'completed',
  'canceled',
]

function matchesCustomerSearch(c: Customer, q: string): boolean {
  const s = q.trim().toLowerCase()
  if (!s) return true
  return (
    c.full_name.toLowerCase().includes(s) ||
    c.email.toLowerCase().includes(s) ||
    c.phone.includes(s) ||
    c.address.toLowerCase().includes(s)
  )
}

const customerSelectClass =
  'min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500/60 dark:focus:ring-emerald-500/20 sm:text-sm'

export function JobForm({
  customers,
  employees,
  initial,
  scheduleDateLabel,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  customers: Customer[]
  employees: Employee[]
  initial: Omit<Job, 'id'>
  /** Shown when opening “new job” from calendar with a pre-filled date. */
  scheduleDateLabel?: string
  submitLabel: string
  onSubmit: (values: Omit<Job, 'id'>) => void
  onCancel: () => void
}) {
  const { addCustomer } = useAppData()
  const [values, setValues] = useState<Omit<Job, 'id'>>(() => initial)
  const [customerSearch, setCustomerSearch] = useState('')
  const [newCustomerOpen, setNewCustomerOpen] = useState(false)
  const [newCustomerDraft, setNewCustomerDraft] = useState(emptyCustomerDraft)
  /** Until parent `customers` includes the new id, keep a snapshot so the customer select shows the right label. */
  const [pendingCustomer, setPendingCustomer] = useState<Customer | null>(null)

  const set = (patch: Partial<Omit<Job, 'id'>>) =>
    setValues((v) => ({ ...v, ...patch }))

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => matchesCustomerSearch(c, customerSearch))
  }, [customers, customerSearch])

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === values.customer_id) ?? pendingCustomer
  }, [customers, values.customer_id, pendingCustomer])

  const customersForSelect = useMemo(() => {
    const list = filteredCustomers
    const sel = selectedCustomer
    if (sel && !list.some((c) => c.id === sel.id)) {
      return [sel, ...list]
    }
    return list
  }, [filteredCustomers, selectedCustomer])

  const showNoMatchCreate =
    Boolean(customerSearch.trim()) && filteredCustomers.length === 0 && customers.length > 0

  const handleCustomerChange = (customerId: string) => {
    setPendingCustomer(null)
    const c = customers.find((x) => x.id === customerId)
    set({
      customer_id: customerId,
      customer_name: c?.full_name ?? '',
      address: c?.address ?? '',
    })
  }

  const toggleAssignee = (id: string) => {
    const has = values.assignees.includes(id)
    const next = has ? values.assignees.filter((x) => x !== id) : [...values.assignees, id]
    let status = values.status
    if (status !== 'completed' && status !== 'canceled') {
      if (next.length === 0) status = 'unassigned'
      else if (status === 'unassigned') status = 'scheduled'
    }
    set({ assignees: next, status })
  }

  const openNewCustomer = (prefill?: Partial<Omit<Customer, 'id'>>) => {
    setNewCustomerDraft({ ...emptyCustomerDraft(), ...prefill })
    setNewCustomerOpen(true)
  }

  const closeNewCustomer = () => {
    setNewCustomerOpen(false)
    setNewCustomerDraft(emptyCustomerDraft())
  }

  const saveNewCustomer = () => {
    if (!newCustomerDraft.full_name.trim()) return
    const c = addCustomer(newCustomerDraft)
    setPendingCustomer(c)
    set({
      customer_id: c.id,
      customer_name: c.full_name,
      address: c.address ?? '',
    })
    setCustomerSearch('')
    closeNewCustomer()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!values.title.trim()) return
    if (!values.customer_id) return
    onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="rounded-[16px] border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs leading-relaxed text-slate-600 dark:border-[#1F2A36] dark:bg-[#151B23] dark:text-[#94A3B8]">
        {scheduleDateLabel ? (
          <>
            The <span className="font-semibold text-slate-800 dark:text-slate-200">date</span> field
            below matches the calendar day you clicked — adjust times if needed. Choosing a customer
            fills the service address; edit it if the visit is elsewhere.
          </>
        ) : (
          <>Choosing a customer fills the service address — edit below if the visit is elsewhere.</>
        )}
      </p>

      <Input
        label="Job title"
        value={values.title}
        onChange={(e) => set({ title: e.target.value })}
        placeholder="Job title"
        required
      />

      <div className="rounded-[18px] border border-slate-200 bg-slate-50/50 p-4 dark:border-[#1F2A36] dark:bg-[#11161D]">
        <div className="flex flex-wrap items-start justify-between gap-2 sm:items-center">
          <div className="min-w-0 flex-1">
            <div id="job-customer-heading" className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">
              Customer
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-[#94A3B8]">
              Select an existing account or add someone new without leaving this form.
            </p>
          </div>
          {!newCustomerOpen ? (
            <button
              type="button"
              onClick={() => openNewCustomer()}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-[13px] border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 shadow-sm transition hover:-translate-y-px hover:border-blue-300 hover:bg-blue-50 dark:border-blue-500/25 dark:bg-[#151B23] dark:text-blue-200 dark:hover:border-blue-400/45"
            >
              <span className="text-base leading-none text-blue-600 dark:text-blue-300" aria-hidden>
                +
              </span>
              New customer
            </button>
          ) : null}
        </div>

        <div className="mt-3 space-y-2.5">
          {newCustomerOpen ? (
            <div
              className="rounded-[18px] border border-slate-200 border-l-4 border-l-blue-500 bg-white p-4 shadow-sm dark:border-[#1F2A36] dark:border-l-blue-500 dark:bg-[#151B23] dark:shadow-black/20"
              role="region"
              aria-label="New customer"
            >
              <p className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">New customer</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-[#94A3B8]">
                Saved to your directory and selected for this job. You can edit details anytime from
                Customers.
              </p>
              <div className="mt-3">
                <CustomerFieldsForm
                  compact
                  idPrefix="job-inline-customer"
                  values={newCustomerDraft}
                  onChange={(patch) => setNewCustomerDraft((d) => ({ ...d, ...patch }))}
                />
              </div>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                <Button type="button" variant="secondary" onClick={closeNewCustomer}>
                  Cancel
                </Button>
                <Button type="button" onClick={saveNewCustomer}>
                  Save &amp; use for job
                </Button>
              </div>
            </div>
          ) : customers.length === 0 ? (
            <div className="rounded-[16px] border border-dashed border-slate-300 bg-white/80 px-3 py-4 text-center dark:border-[#1F2A36] dark:bg-[#151B23]">
              <p className="text-sm text-slate-600 dark:text-[#94A3B8]">No clients yet.</p>
              <button
                type="button"
                onClick={() => openNewCustomer()}
                className="mt-2 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
              >
                Add your first client
              </button>
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="job-customer-search" className="sr-only">
                  Search customers
                </label>
                <input
                  id="job-customer-search"
                  type="search"
                  placeholder="Search by name, phone, or email…"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className={customerSelectClass}
                  autoComplete="off"
                />
              </div>
              {showNoMatchCreate ? (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-amber-200/90 bg-amber-50/95 px-3 py-2 text-xs text-amber-950 dark:border-amber-800/70 dark:bg-amber-950/40 dark:text-amber-100">
                  <span>No match for &ldquo;{customerSearch.trim()}&rdquo;</span>
                  <button
                    type="button"
                    className="font-semibold text-emerald-800 underline decoration-emerald-700/50 underline-offset-2 hover:text-emerald-900 dark:text-emerald-400 dark:decoration-emerald-500/50 dark:hover:text-emerald-300"
                    onClick={() => openNewCustomer({ full_name: customerSearch.trim() })}
                  >
                    Create new customer
                  </button>
                </div>
              ) : null}
              <div>
                <select
                  id="job-customer-select"
                  aria-labelledby="job-customer-heading"
                  value={values.customer_id}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  required
                  className={customerSelectClass}
                >
                  <option value="" disabled>
                    Select a customer
                  </option>
                  {customersForSelect.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      <Input
        label="Service type"
        value={values.service_type}
        onChange={(e) => set({ service_type: e.target.value })}
        placeholder="Service type"
      />
      <Input
        label="Address"
        value={values.address}
        onChange={(e) => set({ address: e.target.value })}
      />
      <div className="grid gap-4 min-[430px]:grid-cols-3">
        <Input
          label="Date"
          type="date"
          value={values.date}
          onChange={(e) => set({ date: e.target.value })}
          required
        />
        <Input
          label="Start"
          type="time"
          value={values.start_time}
          onChange={(e) => set({ start_time: e.target.value })}
        />
        <Input
          label="End"
          type="time"
          value={values.end_time}
          onChange={(e) => set({ end_time: e.target.value })}
        />
      </div>
      <fieldset className="space-y-3 rounded-[18px] border border-slate-200 bg-slate-50/50 p-4 dark:border-[#1F2A36] dark:bg-[#11161D]">
        <legend className="px-1 text-sm font-semibold text-slate-800 dark:text-slate-200">Crew</legend>
        <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
          Pick who should handle this job. Leave it unassigned if you still need to decide.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {employees
            .filter((e) => e.status === 'active')
            .map((e) => (
              <label
                key={e.id}
                className="flex min-h-11 cursor-pointer items-start gap-3 rounded-[15px] border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm transition hover:-translate-y-px hover:border-blue-300 dark:border-[#1F2A36] dark:bg-[#151B23] dark:hover:border-blue-500/45"
              >
                <input
                  type="checkbox"
                  className="mt-0.5 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-[#11161D]"
                  checked={values.assignees.includes(e.id)}
                  onChange={() => toggleAssignee(e.id)}
                />
                <span className="min-w-0">
                  <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{e.full_name}</span>
                  <span className="block text-xs text-slate-500 dark:text-[#94A3B8]">{e.role}</span>
                </span>
              </label>
            ))}
        </div>
      </fieldset>
      <Select
        label="Status"
        value={values.status}
        onChange={(e) => set({ status: e.target.value as JobStatus })}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {JOB_STATUS_LABELS[s]}
          </option>
        ))}
      </Select>
      <Textarea
        label="Notes"
        value={values.notes}
        onChange={(e) => set({ notes: e.target.value })}
        placeholder="Notes for the crew"
      />
      <div className="sticky bottom-0 -mx-4 flex flex-col-reverse gap-2 border-t border-slate-100 bg-white px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-4 dark:border-[#1F2A36] dark:bg-[#11161D] sm:static sm:mx-0 sm:flex-row sm:justify-end sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-5 sm:dark:bg-transparent">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={newCustomerOpen}
          title={
            newCustomerOpen
              ? 'Save or cancel the new customer section first'
              : undefined
          }
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
