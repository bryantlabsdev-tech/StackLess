import { AppShell } from '../components/layout/AppShell'
import { RoleGuard } from '../routes/RoleGuard'

/** Field crew shell — assigned jobs, personal schedule, limited dashboard only. */
export function EmployeeLayout() {
  return (
    <RoleGuard allow={['employee']}>
      <AppShell variant="employee" />
    </RoleGuard>
  )
}
