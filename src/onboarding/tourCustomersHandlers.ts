type Handlers = {
  openCreateCustomer: () => void
}

let handlers: Handlers | null = null

export function registerTourCustomersHandlers(h: Handlers) {
  handlers = h
}

export function unregisterTourCustomersHandlers() {
  handlers = null
}

export function tourOpenCustomerCreateModal() {
  handlers?.openCreateCustomer()
}
