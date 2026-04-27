import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import type { Customer } from '../../types'

export function CustomerFieldsForm({
  values,
  onChange,
  idPrefix = 'customer',
  compact,
}: {
  values: Omit<Customer, 'id'>
  onChange: (patch: Partial<Omit<Customer, 'id'>>) => void
  /** Prefix for input ids (avoid duplicates when nested in job form). */
  idPrefix?: string
  /** Tighter spacing for nested / modal-in-modal contexts. */
  compact?: boolean
}) {
  return (
    <div
      className={
        compact
          ? 'grid gap-2.5 sm:grid-cols-2 sm:gap-3'
          : 'grid gap-3 sm:grid-cols-2 sm:gap-4'
      }
    >
      <Input
        id={`${idPrefix}-full_name`}
        label="Full name"
        value={values.full_name}
        onChange={(e) => onChange({ full_name: e.target.value })}
        required
        autoComplete="name"
      />
      <Input
        id={`${idPrefix}-phone`}
        label="Phone"
        value={values.phone}
        onChange={(e) => onChange({ phone: e.target.value })}
        autoComplete="tel"
      />
      <Input
        id={`${idPrefix}-email`}
        label="Email"
        type="email"
        value={values.email}
        onChange={(e) => onChange({ email: e.target.value })}
        autoComplete="email"
      />
      <Input
        id={`${idPrefix}-address`}
        label="Address"
        value={values.address}
        onChange={(e) => onChange({ address: e.target.value })}
        autoComplete="street-address"
      />
      <div className="sm:col-span-2">
        <Textarea
          id={`${idPrefix}-notes`}
          label="Notes"
          value={values.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Billing, pets on site, preferences…"
        />
      </div>
    </div>
  )
}
