import { Navigate, Route, Routes } from 'react-router-dom'
import { BillingPage } from '../pages/BillingPage'
import { CalendarPage } from '../pages/CalendarPage'
import { CustomersPage } from '../pages/CustomersPage'
import { DashboardPage } from '../pages/DashboardPage'
import { EmployeesPage } from '../pages/EmployeesPage'
import { JobDetailPage } from '../pages/JobDetailPage'
import { JobsPage } from '../pages/JobsPage'
import { LandingPage } from '../pages/LandingPage'
import { LoginPage } from '../pages/LoginPage'
import { SettingsPage } from '../pages/SettingsPage'
import { SignupPage } from '../pages/SignupPage'
import { AdminLayout } from '../layouts/AdminLayout'
import { CatchAllRedirect } from './redirects'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route element={<AdminLayout />}>
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/jobs/:jobId" element={<JobDetailPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="/employee-dashboard" element={<Navigate to="/dashboard" replace />} />
      <Route path="/my-jobs/:jobId" element={<Navigate to="/dashboard" replace />} />
      <Route path="/my-jobs" element={<Navigate to="/dashboard" replace />} />
      <Route path="/my-schedule" element={<Navigate to="/dashboard" replace />} />

      <Route path="*" element={<CatchAllRedirect />} />
    </Routes>
  )
}
