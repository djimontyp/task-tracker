import { useMemo } from 'react'
import { LayoutDashboard, CheckSquare, BarChart3, Settings, ListChecks, Plus } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarFooter,
  SidebarSeparator,
} from '@/shared/ui/sidebar'
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

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-3">
        <div className="flex items-center gap-3 rounded-lg border border-sidebar-border/80 bg-sidebar-accent/30 px-3 py-2 shadow-sm">
          <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
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
              {items.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild tooltip={item.label}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        cn(
                          'relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/75 transition-all duration-200 ease-out',
                          'hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                          'before:absolute before:-left-5 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-transparent',
                          'group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0',
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-foreground shadow-sm before:bg-primary'
                            : 'before:bg-transparent'
                        )
                      }
                    >
                      <item.icon className="size-4 shrink-0" />
                      <span className="flex-1 truncate group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
      <SidebarRail />
    </Sidebar>
  )
}
