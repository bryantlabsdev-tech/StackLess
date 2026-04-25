import { useTheme } from '../../hooks/useTheme'
import { Button } from '../ui/Button'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button
      type="button"
      variant="secondary"
      className={`min-h-[44px] w-full justify-center text-sm font-semibold ${className}`}
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
    </Button>
  )
}
