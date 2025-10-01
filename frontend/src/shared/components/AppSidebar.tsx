import { useMemo } from 'react'
import { LayoutDashboard, CheckSquare, BarChart3, Settings, ListChecks } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from '@/shared/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip'
import { cn } from '@/shared/lib/utils'
import { useWebSocket } from '@/features/websocket/hooks/useWebSocket'

const navItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
]

export function AppSidebar() {
  const items = useMemo(() => navItems, [])
  const location = useLocation()
  const { state } = useSidebar()
  const { isConnected } = useWebSocket()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-2 border-b border-border">
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg bg-sidebar-accent/40 px-2 py-1',
            'group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-1 group-data-[collapsible=icon]:bg-transparent'
          )}
        >
          <div
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-md transition-all duration-200',
              'bg-primary/10 text-primary border border-primary/20'
            )}
          >
            <ListChecks className="size-4" />
          </div>
          <div className="space-y-0.5 overflow-hidden group-data-[collapsible=icon]:hidden">
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/60">Topics Radar</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path)

                return (
                  <SidebarMenuItem key={item.path}>
                    <Tooltip disableHoverableContent defaultOpen={false}>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className={cn(
                            'px-3 py-2 text-sm font-medium transition-colors duration-200 ease-out',
                            'text-sidebar-foreground/70 hover:text-sidebar-foreground',
                            'data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:border data-[active=true]:border-primary/20',
                            'group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0 group-data-[collapsible=icon]:h-11 group-data-[collapsible=icon]:w-11 group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:border group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:shadow-none',
                            'data-[active=true]:group-data-[collapsible=icon]:border-primary/20 data-[active=true]:group-data-[collapsible=icon]:bg-primary/10 data-[active=true]:group-data-[collapsible=icon]:text-primary'
                          )}
                        >
                          <Link
                            to={item.path}
                            className={cn(
                              'flex w-full items-center gap-3',
                              state === 'collapsed' && 'justify-center gap-0'
                            )}
                          >
                            <item.icon
                              className={cn(
                                'size-4 shrink-0 transition-all duration-200',
                                state === 'collapsed' && 'mx-auto'
                              )}
                            />
                            <span className="flex-1 truncate group-data-[collapsible=icon]:hidden">{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {state === 'collapsed' && (
                        <TooltipContent className="bg-neutral-900 text-white border border-neutral-700 shadow-lg dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-300">
                          {item.label}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator className="mx-3" />
      <SidebarFooter className="px-3 py-4">
        <Tooltip disableHoverableContent>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'flex items-center gap-3 rounded-lg border border-sidebar-border/70 bg-sidebar-accent/40 px-3 py-2 text-xs text-sidebar-foreground/70 transition-all duration-200',
                'group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2'
              )}
              role="status"
              aria-live="polite"
            >
              <span
                className={cn(
                  'size-2.5 rounded-full shadow-[0_0_0_3px_rgba(16,185,129,0.12)] transition-colors duration-300',
                  isConnected
                    ? 'bg-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.25)]'
                    : 'bg-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.25)]'
                )}
                aria-hidden="true"
              />
              <div className="flex-1 space-y-0.5 group-data-[collapsible=icon]:hidden">
                <p className="text-[11px] font-semibold text-sidebar-foreground/80">
                  {isConnected ? 'API Connected' : 'API Disconnected'}
                </p>
                <p className="text-[10px] text-sidebar-foreground/60">
                  {isConnected ? 'Real-time updates active' : 'Attempting reconnection'}
                </p>
              </div>
              <span className="sr-only">
                API connection status: {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8} className="px-3 py-2 text-xs">
            {isConnected ? 'API Connected' : 'API Disconnected'}
          </TooltipContent>
        </Tooltip>
      </SidebarFooter>
    </Sidebar>
  )
}
