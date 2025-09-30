import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useWebSocket } from '@features/websocket/hooks/useWebSocket'
import { useTheme } from '../../../components/ThemeProvider'

const Header = () => {
  const { isConnected } = useWebSocket()
  const { effectiveTheme, setTheme, theme } = useTheme()

  const handleToggleTheme = () => {
    // Cycle: light -> dark -> system
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  return (
    <header className="bg-card shadow-sm border-b border-border px-4 md:px-6 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg md:text-xl font-semibold text-foreground">Welcome back!</h2>

        <div className="flex items-center gap-4">
          <button
            onClick={handleToggleTheme}
            className="p-2 rounded-lg hover:bg-accent/10 transition-colors"
            aria-label="Toggle theme"
            title={`Current: ${theme} (${effectiveTheme})`}
          >
            {effectiveTheme === 'light' ? (
              <Moon className="w-5 h-5 text-foreground" />
            ) : (
              <Sun className="w-5 h-5 text-foreground" />
            )}
          </button>

          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
              aria-label={isConnected ? 'Connected' : 'Disconnected'}
            />
            <span className="text-sm text-muted-foreground hidden md:inline">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header