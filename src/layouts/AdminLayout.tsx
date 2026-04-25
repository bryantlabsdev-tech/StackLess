import { AppShell } from '../components/layout/AppShell'
import { RoleGuard } from '../routes/RoleGuard'

/** Admin app shell — full customers, jobs, calendar, employees, dashboard. */
export function AdminLayout() {
  return (
    <RoleGuard allow={['admin']}>
      <AppShell variant="admin" />
    </RoleGuard>
  )
}
