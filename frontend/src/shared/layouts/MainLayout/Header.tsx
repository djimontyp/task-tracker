import React, { useMemo } from 'react'
import { Sun, Moon } from 'lucide-react'
import { useLocation, Link } from 'react-router-dom'
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
    <header className="sticky top-0 z-40 bg-card border-b border-border/80">
      <div className="flex min-h-[56px] items-center justify-between gap-2 px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8 2xl:px-10 3xl:px-12">
        <div className="flex items-center gap-2">
          <SidebarTrigger
            variant="ghost"
            size="icon"
            className="h-8 w-8 border-0 bg-transparent text-muted-foreground hover:bg-accent/20 hover:text-foreground"
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
        </div>
      </div>
    </header>
  )
}

export default Header