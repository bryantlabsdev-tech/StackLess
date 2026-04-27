import type { Customer } from '../types'

export function emptyCustomerDraft(): Omit<Customer, 'id'> {
  return {
    full_name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  }
}
