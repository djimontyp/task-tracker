import React, { useState } from 'react'
import { Settings, Search, Menu } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { Logo } from '@/shared/components/Logo'
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
      ? 'bg-semantic-success shadow-[0_0_0_3px_hsl(var(--semantic-success)/0.25)]'
      : indicator === 'warning'
        ? 'bg-semantic-warning shadow-[0_0_0_3px_hsl(var(--semantic-warning)/0.25)] animate-pulse'
        : 'bg-destructive shadow-[0_0_0_3px_hsl(var(--destructive)/0.25)] animate-pulse'

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
    <header className={cn(
      "z-50 h-14 w-full",
      "bg-card border-b border-border",
      // Desktop: no positioning (in grid), Mobile: fixed
      !isDesktop && "fixed top-0 left-0 right-0"
    )}>
      <div className="flex flex-col md:flex-row h-auto md:h-14 px-2 sm:px-4 md:px-4 lg:px-6">
        <div className="flex items-center justify-between gap-2 sm:gap-2 min-w-0 flex-1 py-2 md:py-0">
          <div className="flex items-center gap-2 sm:gap-2 min-w-0 flex-shrink">
            {/* Desktop: NO logo (it's in sidebar) */}
            {/* Mobile: Logo in navbar */}
            {!isDesktop && (
              <Logo size="sm" showText className="-ml-2 sm:-ml-4" />
            )}

            {/* Desktop: NO sidebar trigger (it's in sidebar footer now) */}
            {/* Mobile: Keep hamburger menu button */}
            {!isDesktop && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onMobileSidebarToggle}
                className="h-11 w-11 shrink-0 rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Toggle sidebar"
              >
                <Menu className="size-5" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden min-h-11 min-w-11 h-11 w-11 aspect-square border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground shrink-0"
              onClick={() => setMobileSearchOpen(true)}
              aria-label="Open search"
            >
              <Search className="h-5 w-5" />
            </Button>

            <div
              className="hidden sm:flex items-center gap-2 px-2 py-2 rounded-md"
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

        <div className="md:hidden px-2 pb-2 border-t border-border overflow-hidden">
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

        <div className="hidden md:flex items-center gap-2 lg:gap-4 flex-shrink-0 overflow-hidden">
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
                  className="flex h-11 w-11 aspect-square border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground shrink-0"
                  onClick={cycleTheme}
                  aria-label="Change theme"
                >
                  <UniversalThemeIcon theme={theme} className="h-5 w-5" />
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
                  className="inline-flex h-11 w-11 aspect-square items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                >
                  <Settings className="w-5 h-5" />
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
