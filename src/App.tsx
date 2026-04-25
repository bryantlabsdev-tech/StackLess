import { HashRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import { AppDataProvider } from './context/AppDataProvider'
import { ThemeProvider } from './context/ThemeProvider'
import { AppRoutes } from './routes/AppRoutes'

export default function App() {
  return (
    <HashRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppDataProvider>
            <AppRoutes />
          </AppDataProvider>
        </AuthProvider>
      </ThemeProvider>
    </HashRouter>
  )
}
