import { useMemo, useEffect } from 'react'
import { LayoutDashboard, CheckSquare, BarChart3, Settings, Radar, Bot, Brain, Mail, MessageSquare, ListChecks, ClipboardList, Server, FolderKanban } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
} from '@/shared/ui/sidebar'
import { cn } from '@/shared/lib/utils'
import { useServiceStatus } from '@/features/websocket/hooks/useServiceStatus'
import { NavUser } from './NavUser'
import { statsService, type SidebarCounts } from '@/shared/api/statsService'
import { NotificationBadge } from '@/shared/ui'

const navGroups = [
  {
    label: 'Workspace',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/messages', label: 'Messages', icon: Mail },
      { path: '/topics', label: 'Topics', icon: MessageSquare },
      { path: '/tasks', label: 'Tasks', icon: CheckSquare },
    ],
  },
  {
    label: 'AI Analysis',
    items: [
      { path: '/analysis', label: 'Analysis Runs', icon: Brain },
      { path: '/proposals', label: 'Task Proposals', icon: ClipboardList },
    ],
  },
  {
    label: 'AI Configuration',
    items: [
      { path: '/agents', label: 'Agents', icon: Bot },
      { path: '/agent-tasks', label: 'Agent Tasks', icon: ListChecks },
      { path: '/providers', label: 'Providers', icon: Server },
      { path: '/projects', label: 'Projects', icon: FolderKanban },
    ],
  },
  {
    label: 'Insights',
    items: [
      { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
]

const footerItems = [
  { path: '/settings', label: 'Settings', icon: Settings },
]

export function AppSidebar() {
  const groups = useMemo(() => navGroups, [])
  const location = useLocation()
  const { indicator } = useServiceStatus()
  const queryClient = useQueryClient()

  // Fetch sidebar counts
  const { data: counts } = useQuery<SidebarCounts>({
    queryKey: ['sidebar-counts'],
    queryFn: () => statsService.getSidebarCounts(),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // WebSocket integration for real-time updates
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost/ws'
    const ws = new WebSocket(`${wsUrl}?topics=analysis,proposals`)

    ws.onopen = () => {
      console.log('[Sidebar] WebSocket connected for counts')
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        const { topic, event: eventType } = message

        // Invalidate counts on relevant events
        if (
          topic === 'analysis' &&
          ['run_created', 'run_closed', 'run_failed'].includes(eventType)
        ) {
          queryClient.invalidateQueries({ queryKey: ['sidebar-counts'] })
        }

        if (
          topic === 'proposals' &&
          ['proposal_created', 'proposal_approved', 'proposal_rejected'].includes(eventType)
        ) {
          queryClient.invalidateQueries({ queryKey: ['sidebar-counts'] })
        }
      } catch (error) {
        console.error('[Sidebar] Error parsing WebSocket message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('[Sidebar] WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('[Sidebar] WebSocket disconnected')
    }

    return () => {
      ws.close()
    }
  }, [queryClient])

  const indicatorClasses =
    indicator === 'healthy'
      ? 'bg-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.25)]'
      : indicator === 'warning'
        ? 'bg-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.25)]'
        : 'bg-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.25)]'

  const statusTitle =
    indicator === 'healthy'
      ? 'Service healthy'
      : indicator === 'warning'
        ? 'Service unstable'
        : 'Service offline'


  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-2 py-3 border-b border-border">
        <div className="flex w-full items-center gap-3 px-2 group-data-[collapsible=icon]:justify-center">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
            <Radar className="size-5" />
          </div>
          <div className="flex flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
            <span className="text-base font-semibold">Topics Radar</span>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'size-2 rounded-full transition-colors duration-300',
                  indicatorClasses
                )}
              />
              <span className="text-xs text-muted-foreground">{statusTitle}</span>
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="px-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/70">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = item.path === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.path)

                  // Get badge count and tooltip for specific items
                  let badgeCount: number | undefined
                  let badgeTooltip: string | undefined

                  if (item.path === '/analysis' && counts) {
                    badgeCount = counts.unclosed_runs
                    badgeTooltip = badgeCount === 1
                      ? '1 unclosed analysis run'
                      : `${badgeCount} unclosed analysis runs`
                  } else if (item.path === '/proposals' && counts) {
                    badgeCount = counts.pending_proposals
                    badgeTooltip = badgeCount === 1
                      ? '1 proposal awaiting review'
                      : `${badgeCount} proposals awaiting review`
                  }

                  return (
                    <SidebarMenuItem key={item.path}>
                      <div className="flex items-center gap-2 w-full relative">
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.label}
                          className={cn(
                            "h-11 text-base [&>svg]:!size-6 flex-1",
                            "data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold"
                          )}
                        >
                          <Link to={item.path}>
                            <item.icon />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                        <NotificationBadge
                          count={badgeCount || 0}
                          tooltip={badgeTooltip}
                          className={cn(
                            "absolute right-2",
                            isActive && "bg-primary text-white dark:bg-primary dark:text-white border-primary"
                          )}
                        />
                      </div>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {footerItems.map((item) => {
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path)

            return (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.label}
                  className={cn(
                    "h-11 text-base [&>svg]:!size-6",
                    "data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold"
                  )}
                >
                  <Link to={item.path}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
        <SidebarSeparator />
        <NavUser
          user={{
            name: 'User',
            email: 'user@example.com',
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
