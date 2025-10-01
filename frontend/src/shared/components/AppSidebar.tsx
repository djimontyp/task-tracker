import { useMemo } from 'react'
import { LayoutDashboard, CheckSquare, BarChart3, Settings, ListChecks, Plus } from 'lucide-react'
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
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'

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

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-3">
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg border border-sidebar-border/80 bg-sidebar-accent/30 px-3 py-2 shadow-sm',
            'group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2 group-data-[collapsible=icon]:border-none group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:shadow-none'
          )}
        >
          <div
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-md transition-all duration-200',
              state === 'collapsed'
                ? 'size-8 bg-sidebar-foreground text-sidebar'
                : 'bg-orange-500 text-white shadow-sm dark:bg-orange-400 dark:text-slate-950'
            )}
          >
            <ListChecks className="size-4" />
          </div>
          <div className="space-y-0.5 overflow-hidden group-data-[collapsible=icon]:hidden">
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/60">Task Tracker</p>
            <p className="truncate text-sm font-semibold text-sidebar-foreground">Workspace</p>
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
                            'data-[active=true]:bg-orange-100 data-[active=true]:text-orange-800 dark:data-[active=true]:bg-orange-900/40 dark:data-[active=true]:text-orange-200 data-[active=true]:border data-[active=true]:border-orange-200 dark:data-[active=true]:border-orange-800',
                            'group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0 group-data-[collapsible=icon]:h-11 group-data-[collapsible=icon]:w-11 group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:border group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:shadow-none',
                            'data-[active=true]:group-data-[collapsible=icon]:border-orange-500 data-[active=true]:group-data-[collapsible=icon]:bg-orange-500 data-[active=true]:group-data-[collapsible=icon]:text-white'
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
        <div className="space-y-3 rounded-lg border border-dashed border-sidebar-border bg-sidebar-accent/25 p-3 text-xs text-sidebar-foreground/70 shadow-sm group-data-[collapsible=icon]:hidden">
          <div>
            <p className="text-sm font-semibold text-sidebar-foreground">Need a quick boost?</p>
            <p className="mt-1 leading-relaxed">
              Create a new task in seconds and keep the momentum going.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full gap-2 border-sidebar-border text-sidebar-foreground"
            aria-label="Create new task"
          >
            <Plus className="size-4" aria-hidden="true" />
            New task
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
