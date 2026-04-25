import { useMemo, useState } from 'react'
import { useAppData } from '../hooks/useAppData'
import { PageContainer } from '../components/layout/PageContainer'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { CustomerFieldsForm } from '../components/customers/CustomerFieldsForm'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import type { Customer } from '../types'

export function CustomersPage() {
  const { customers, jobs, addCustomer, updateCustomer } = useAppData()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return customers
    return customers.filter(
      (c) =>
        c.full_name.toLowerCase().includes(s) ||
        c.email.toLowerCase().includes(s) ||
        c.phone.includes(s) ||
        c.address.toLowerCase().includes(s),
    )
  }, [customers, q])

  const jobCounts = useMemo(() => {
    const counts = new Map<string, { total: number; active: number }>()
    for (const job of jobs) {
      const row = counts.get(job.customer_id) ?? { total: 0, active: 0 }
      row.total += 1
      if (job.status !== 'completed' && job.status !== 'canceled') row.active += 1
      counts.set(job.customer_id, row)
    }
    return counts
  }, [jobs])

  const startCreate = () => {
    setEditing(null)
    setOpen(true)
  }

  const startEdit = (c: Customer) => {
    setEditing(c)
    setOpen(true)
  }

  return (
    <PageContainer>
      <PageHeader
        title="Customers"
        description="Keep contact details and service addresses in one place for faster job setup."
        action={
          <Button type="button" onClick={startCreate}>
            Add customer
          </Button>
        }
      />

      <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm dark:border-[#1F2A36] dark:bg-[#11161D] dark:shadow-black/20 sm:p-5">
        <Input
          placeholder="Search by name, email, phone, or address…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search customers"
        />
      </div>

      <div>
        {customers.length === 0 ? (
          <EmptyState
            title="No clients yet"
            detail="Add your first client to start tracking jobs"
            action={<Button onClick={startCreate}>Add client</Button>}
          />
        ) : filtered.length === 0 ? (
          <EmptyState title="No matches" detail="Try a different search term." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((c) => {
              const counts = jobCounts.get(c.id) ?? { total: 0, active: 0 }
              return (
                <article
                  key={c.id}
                  className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-xl dark:border-[#1F2A36] dark:bg-[#11161D] dark:shadow-black/20 dark:hover:border-blue-500/45"
                >
                  <div className="flex flex-col items-start gap-3 min-[420px]:flex-row min-[420px]:justify-between">
                    <div className="min-w-0">
                      <h2 className="break-words text-base font-semibold tracking-[-0.02em] text-slate-950 dark:text-[#F8FAFC]">{c.full_name}</h2>
                      <p className="mt-1 break-words text-sm text-slate-500 dark:text-[#94A3B8]">{c.address || 'No address yet'}</p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-200 dark:ring-blue-500/25">
                      {counts.active} active
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 text-sm">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Contact</p>
                      <p className="mt-1 text-slate-700 dark:text-slate-300">{c.phone || 'No phone'}</p>
                      <p className="mt-0.5 truncate text-slate-500 dark:text-[#94A3B8]">{c.email || 'No email'}</p>
                    </div>
                    <div className="rounded-[16px] border border-slate-200 bg-slate-50 p-3 dark:border-[#1F2A36] dark:bg-[#151B23]">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Jobs</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {counts.total} total · {counts.active} active
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end border-t border-slate-100 pt-4 dark:border-[#1F2A36]">
                    <Button variant="secondary" className="w-full !px-3 !py-2 min-[420px]:w-auto" onClick={() => startEdit(c)}>
                      View details
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {open ? (
        <CustomerModal
          key={editing?.id ?? 'new'}
          initial={editing}
          onClose={() => setOpen(false)}
          onSave={(payload) => {
            if (editing) updateCustomer(editing.id, payload)
            else addCustomer(payload)
            setOpen(false)
          }}
        />
      ) : null}
    </PageContainer>
  )
}

function CustomerModal({
  initial,
  onClose,
  onSave,
}: {
  initial: Customer | null
  onClose: () => void
  onSave: (c: Omit<Customer, 'id'>) => void
}) {
  const [values, setValues] = useState<Omit<Customer, 'id'>>(() =>
    initial
      ? {
          full_name: initial.full_name,
          phone: initial.phone,
          email: initial.email,
          address: initial.address,
          notes: initial.notes,
        }
      : {
          full_name: '',
          phone: '',
          email: '',
          address: '',
          notes: '',
        },
  )

  const set = (patch: Partial<Omit<Customer, 'id'>>) =>
    setValues((v) => ({ ...v, ...patch }))

  return (
    <Modal
      open
      title={initial ? 'Edit customer' : 'New customer'}
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
            Save customer
          </Button>
        </>
      }
    >
      <p className="mb-4 text-sm text-slate-600 dark:text-[#94A3B8]">
        {initial
          ? 'Update how your crew sees this account on jobs and the schedule.'
          : 'We’ll use this on new jobs — you can edit anytime.'}
      </p>
      <CustomerFieldsForm values={values} onChange={set} idPrefix="customers-page" />
    </Modal>
  )
}
