import React, { useMemo } from 'react'
import { Sun, Moon } from 'lucide-react'
import { useLocation, Link } from 'react-router-dom'
import { useWebSocket } from '@features/websocket/hooks/useWebSocket'
import { useTheme } from '../../../components/ThemeProvider'
import { SidebarTrigger } from '@/shared/ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/ui/breadcrumb'

interface BreadcrumbSegment {
  label: string
  href?: string
}

const breadcrumbMap: Record<string, BreadcrumbSegment[]> = {
  '/': [
    { label: 'Home', href: '/' },
    { label: 'Dashboard' },
  ],
  '/tasks': [
    { label: 'Home', href: '/' },
    { label: 'Tasks' },
  ],
  '/analytics': [
    { label: 'Home', href: '/' },
    { label: 'Analytics' },
  ],
  '/settings': [{ label: 'Settings' }],
}

const Header = () => {
  const { isConnected } = useWebSocket()
  const { effectiveTheme, setTheme, theme } = useTheme()
  const location = useLocation()

  const crumbs = useMemo((): BreadcrumbSegment[] => {
    const segments = breadcrumbMap[location.pathname]

    if (!segments) {
      return location.pathname
        .split('/')
        .filter(Boolean)
        .map((segment) => ({
          label: segment.charAt(0).toUpperCase() + segment.replace(/-/g, ' ').slice(1),
        }))
    }

    return segments
  }, [location.pathname])

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
    <header className="bg-card shadow-sm border-b border-border px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SidebarTrigger
            variant="ghost"
            size="icon"
            className="h-9 w-9 border-0 bg-transparent text-muted-foreground hover:bg-accent/20 hover:text-foreground"
          />
          <Breadcrumb>
            <BreadcrumbList>
              {crumbs.map((segment, index) => {
                const isLast = index === crumbs.length - 1
                return (
                  <React.Fragment key={`${segment.label}-${index}`}>
                    <BreadcrumbItem>
                      {segment.href && !isLast ? (
                        <BreadcrumbLink asChild>
                          <Link to={segment.href}>{segment.label}</Link>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{segment.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                    {!isLast && <BreadcrumbSeparator />}
                  </React.Fragment>
                )
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleTheme}
            className="p-1.5 flex items-center justify-center rounded-lg hover:bg-accent/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Toggle theme"
            title={`Current: ${theme} (${effectiveTheme})`}
          >
            {effectiveTheme === 'light' ? (
              <Moon className="w-5 h-5 text-foreground" />
            ) : (
              <Sun className="w-5 h-5 text-foreground" />
            )}
          </button>

          <div className="flex items-center gap-2" role="status" aria-live="polite">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
              aria-hidden="true"
            />
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {isConnected ? 'API Connected' : 'API Disconnected'}
            </span>
            <span className="sr-only">
              API connection status: {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header