import React, { useState } from 'react'
import { AdjustmentsHorizontalIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
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
import { MobileSearch } from '@/shared/components/MobileSearch'
import { useBreadcrumbs } from './useBreadcrumbs'
import { useAdminMode } from '@/shared/hooks'

interface NavbarProps {
  onMobileSidebarToggle?: () => void
  isDesktop?: boolean
}

const Navbar = ({ onMobileSidebarToggle, isDesktop = true }: NavbarProps) => {
  const { setTheme, theme } = useTheme()
  const { indicator } = useServiceStatus()
  const { isAdminMode } = useAdminMode()
  const location = useLocation()
  const crumbs = useBreadcrumbs(location.pathname)
  const appName = import.meta.env.VITE_APP_NAME || 'Pulse Radar'
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

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
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-card border-b border-border/80 overflow-hidden">
      <div className="flex flex-col md:flex-row h-auto md:h-[56px] px-2 sm:px-3 md:px-4 lg:px-6">
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 min-w-0 flex-1 py-2 md:py-0">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-shrink">
            <Link
              to="/"
              className="flex h-11 shrink-0 items-center gap-1.5 sm:gap-2 rounded-lg px-1.5 sm:px-2 text-foreground transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`${appName} home`}
            >
              <span className="flex size-8 sm:size-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary shadow-sm">
                <SignalIcon className="size-4 sm:size-5" />
              </span>
              <span className="hidden text-sm sm:text-base font-semibold tracking-tight text-foreground sm:inline-block">
                {appName}
              </span>
            </Link>

            {isDesktop ? (
              <SidebarTrigger
                variant="ghost"
                size="icon"
                className="h-9 w-9 sm:h-11 sm:w-11 shrink-0 rounded-lg border border-border/60 bg-card/60 text-muted-foreground transition-colors hover:bg-accent/15 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Toggle sidebar"
              />
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={onMobileSidebarToggle}
                className="h-9 w-9 sm:h-11 sm:w-11 shrink-0 rounded-lg border border-border/60 bg-card/60 text-muted-foreground transition-colors hover:bg-accent/15 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Toggle sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9 sm:h-11 sm:w-11 aspect-square border border-border/60 bg-card/60 text-muted-foreground hover:bg-accent/15 hover:text-foreground shrink-0"
              onClick={() => setMobileSearchOpen(true)}
              aria-label="Open search"
            >
              <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            <div
              className="hidden sm:flex items-center gap-1.5 px-1.5 py-1 rounded-md"
              title={statusTitle}
              role="status"
              aria-label={statusTitle}
            >
              <span
                className={cn(
                  'size-2.5 sm:size-3 rounded-full transition-colors duration-300',
                  indicatorClasses
                )}
              />
              <span className="hidden md:block text-xs text-muted-foreground whitespace-nowrap">
                {statusText}
              </span>
            </div>

            <NavUser
              user={{
                name: 'User',
                email: 'user@example.com',
              }}
            />
          </div>
        </div>

        <div className="md:hidden px-2 pb-2 border-t border-border/40 overflow-hidden">
          <Breadcrumb className="pt-2">
            <BreadcrumbList className="flex-wrap overflow-hidden">
              {crumbs.map((segment, index) => {
                const isLast = index === crumbs.length - 1
                return (
                  <React.Fragment key={`${segment.label}-${index}`}>
                    <BreadcrumbItem className="text-xs sm:text-sm max-w-[100px] sm:max-w-[120px]">
                      {segment.href && !isLast ? (
                        <BreadcrumbLink asChild>
                          <Link to={segment.href} className="truncate block max-w-full">
                            {segment.label}
                          </Link>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage className="truncate block max-w-full">
                          {segment.label}
                        </BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                    {!isLast && <BreadcrumbSeparator className="shrink-0" />}
                  </React.Fragment>
                )
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="hidden md:flex items-center gap-2 lg:gap-3 flex-shrink-0 overflow-hidden">
          <Breadcrumb className="flex min-w-0">
            <BreadcrumbList className="min-w-0">
              {crumbs.map((segment, index) => {
                const isLast = index === crumbs.length - 1
                return (
                  <React.Fragment key={`${segment.label}-${index}`}>
                    <BreadcrumbItem className="min-w-0 max-w-[200px]">
                      {segment.href && !isLast ? (
                        <BreadcrumbLink asChild>
                          <Link to={segment.href} className="truncate block">{segment.label}</Link>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage className="truncate block">{segment.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                    {!isLast && <BreadcrumbSeparator className="shrink-0" />}
                  </React.Fragment>
                )
              })}
            </BreadcrumbList>
          </Breadcrumb>

          <div className="hidden lg:flex items-center flex-1 justify-center max-w-md mx-2">
            <SearchBar />
          </div>

          <AdminBadge isAdminMode={isAdminMode} className="hidden lg:flex shrink-0" />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex h-9 w-9 lg:h-11 lg:w-11 aspect-square border border-border/60 bg-card/60 text-muted-foreground hover:bg-accent/15 hover:text-foreground shrink-0"
                  onClick={cycleTheme}
                  aria-label="Change theme"
                >
                  <UniversalThemeIcon theme={theme} className="h-4 w-4 lg:h-5 lg:w-5" />
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
                  className="inline-flex h-9 w-9 lg:h-11 lg:w-11 aspect-square items-center justify-center rounded-lg border border-border/60 bg-card/60 text-muted-foreground transition-colors hover:bg-accent/15 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                >
                  <AdjustmentsHorizontalIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <MobileSearch open={mobileSearchOpen} onOpenChange={setMobileSearchOpen} />
    </header>
  )
}

export default Navbar
