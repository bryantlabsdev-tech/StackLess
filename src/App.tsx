import { HashRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import { AppDataProvider } from './context/AppDataProvider'
import { FeedbackProvider } from './context/FeedbackProvider'
import { ThemeProvider } from './context/ThemeProvider'
import { AppRoutes } from './routes/AppRoutes'

export default function App() {
  return (
    <HashRouter>
      <ThemeProvider>
        <FeedbackProvider>
          <AuthProvider>
            <AppDataProvider>
              <AppRoutes />
            </AppDataProvider>
          </AuthProvider>
        </FeedbackProvider>
      </ThemeProvider>
    </HashRouter>
  )
}
