import React from 'react'
import {
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'
import { Link, useLocation } from 'react-router-dom'
import { SidebarTrigger } from '@/shared/ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/ui/breadcrumb'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip'
import { useTheme } from '@/shared/components/ThemeProvider'
import { useServiceStatus } from '@/features/websocket/hooks/useServiceStatus'
import { cn } from '@/shared/lib/utils'
import { NavUser } from '@/shared/components/NavUser'
import { UniversalThemeIcon } from '@/shared/components'
import { useBreadcrumbs } from './useBreadcrumbs'

const Navbar = () => {
  const { setTheme, theme } = useTheme()
  const { indicator } = useServiceStatus()
  const location = useLocation()
  const crumbs = useBreadcrumbs(location.pathname)

  const cycleTheme = () => {
    const themeOrder: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system']
    const currentIndex = themeOrder.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themeOrder.length
    setTheme(themeOrder[nextIndex])
  }

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light theme'
      case 'dark':
        return 'Dark theme'
      case 'system':
        return 'System theme'
      default:
        return 'Change theme'
    }
  }

  const indicatorClasses =
    indicator === 'healthy'
      ? 'bg-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.25)]'
      : indicator === 'warning'
        ? 'bg-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.25)] animate-pulse'
        : 'bg-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.25)] animate-pulse'

  const statusTitle =
    indicator === 'healthy'
      ? 'Service healthy'
      : indicator === 'warning'
        ? 'Service unstable'
        : 'Service offline'

  const statusText =
    indicator === 'healthy'
      ? 'Online'
      : indicator === 'warning'
        ? 'Unstable'
        : 'Offline'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-card border-b border-border/80">
      <div className="flex min-h-[56px] items-center justify-between gap-2 px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <SidebarTrigger
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0 border-0 bg-transparent text-muted-foreground hover:bg-accent/20 hover:text-foreground"
            aria-label="Toggle sidebar"
          />

          <Breadcrumb className="hidden sm:flex">
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

        <div className="flex items-center gap-3 flex-shrink-0">
          <div
            className="flex items-center gap-2 px-2 py-1 rounded-md"
            title={statusTitle}
            role="status"
            aria-label={statusTitle}
          >
            <span
              className={cn(
                'size-3 rounded-full transition-colors duration-300',
                indicatorClasses
              )}
            />
            <span className="hidden md:block text-xs text-muted-foreground">
              {statusText}
            </span>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={cycleTheme}
                  className="h-11 w-11 flex items-center justify-center rounded-lg hover:bg-accent/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                  aria-label="Change theme"
                >
                  <UniversalThemeIcon theme={theme} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{getThemeLabel()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Link
            to="/settings"
            className="h-11 w-11 flex items-center justify-center rounded-lg hover:bg-accent/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Settings"
            title="Settings"
          >
            <Cog6ToothIcon className="w-6 h-6 text-foreground" />
          </Link>

          <NavUser
            user={{
              name: 'User',
              email: 'user@example.com',
            }}
          />
        </div>
      </div>
    </header>
  )
}

export default Navbar
