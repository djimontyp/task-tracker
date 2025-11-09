import React from 'react'
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'
import { SignalIcon } from '@heroicons/react/24/solid'
import { Link, useLocation } from 'react-router-dom'
import { SidebarTrigger } from '@/shared/ui/sidebar'
import { Button } from '@/shared/ui/button'
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
import { UniversalThemeIcon, AdminBadge } from '@/shared/components'
import { SearchBar } from '@/features/search/components'
import { useBreadcrumbs } from './useBreadcrumbs'
import { useAdminMode } from '@/shared/hooks'

const Navbar = () => {
  const { setTheme, theme } = useTheme()
  const { indicator } = useServiceStatus()
  const { isAdminMode } = useAdminMode()
  const location = useLocation()
  const crumbs = useBreadcrumbs(location.pathname)
  const appName = import.meta.env.VITE_APP_NAME || 'Pulse Radar'

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
          <Link
            to="/"
            className="flex h-11 shrink-0 items-center gap-2 rounded-lg px-2 text-foreground transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`${appName} home`}
          >
            <span className="flex size-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary shadow-sm">
              <SignalIcon className="size-5" />
            </span>
            <span className="hidden text-base font-semibold tracking-tight text-foreground sm:inline-block">
              {appName}
            </span>
          </Link>

          <SidebarTrigger
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-lg border border-border/60 bg-card/60 text-muted-foreground transition-colors hover:bg-accent/15 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

        <div className="hidden lg:flex items-center flex-1 justify-center max-w-md mx-4">
          <SearchBar />
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

          <AdminBadge isAdminMode={isAdminMode} className="hidden sm:flex" />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="aspect-square border border-border/60 bg-card/60 text-muted-foreground hover:bg-accent/15 hover:text-foreground shrink-0"
                  onClick={cycleTheme}
                  aria-label="Change theme"
                >
                  <UniversalThemeIcon theme={theme} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{getThemeLabel()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/settings"
                  aria-label="Settings"
                  title="Settings"
                  className="inline-flex h-11 w-11 aspect-square items-center justify-center rounded-lg border border-border/60 bg-card/60 text-muted-foreground transition-colors hover:bg-accent/15 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                >
                  <AdjustmentsHorizontalIcon className="w-5 h-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

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
