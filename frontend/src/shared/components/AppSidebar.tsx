import { useMemo, useEffect, Fragment } from 'react'
import {
  Squares2X2Icon,
  ChartBarIcon,
  Cog6ToothIcon,
  SignalIcon,
  CpuChipIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  ListBulletIcon,
  FolderIcon,
  FunnelIcon,
  BellIcon,
  CalendarIcon,
  SparklesIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/solid'
import { Link, useLocation } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useUiStore } from '@/shared/store/uiStore'
import { logger } from '@/shared/utils/logger'
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
} from '@/shared/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/ui/collapsible'
import { Separator } from '@/shared/ui/separator'
import { cn } from '@/shared/lib/utils'
import { statsService, type SidebarCounts } from '@/shared/api/statsService'
import { NotificationBadge } from '@/shared/ui'
import { GlobalKnowledgeExtractionDialog } from '@/features/knowledge'

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface NavGroup {
  label: string;
  items: NavItem[];
  action?: boolean;
  hoverColor?: string;
}

const navGroups: NavGroup[] = [
  {
    label: 'Data Management',
    hoverColor: 'blue',
    items: [
      { path: '/', label: 'Overview', icon: Squares2X2Icon },
      { path: '/messages', label: 'Messages', icon: EnvelopeIcon },
      { path: '/topics', label: 'Topics', icon: ChatBubbleLeftRightIcon },
    ],
  },
  {
    label: 'AI Operations',
    hoverColor: 'purple',
    items: [
      { path: '/noise-filtering', label: 'Noise Filtering', icon: FunnelIcon },
    ],
    action: true,
  },
  {
    label: 'AI Setup',
    hoverColor: 'amber',
    items: [
      { path: '/agents', label: 'Agents', icon: CpuChipIcon },
      { path: '/agent-tasks', label: 'Task Templates', icon: ListBulletIcon },
      { path: '/projects', label: 'Projects', icon: FolderIcon },
    ],
  },
  {
    label: 'Automation',
    hoverColor: 'green',
    items: [
      { path: '/automation/dashboard', label: 'Overview', icon: SparklesIcon },
      { path: '/automation/rules', label: 'Rules', icon: Cog6ToothIcon },
      { path: '/automation/scheduler', label: 'Scheduler', icon: CalendarIcon },
      { path: '/automation/notifications', label: 'Notifications', icon: BellIcon },
    ],
  },
]

const getHoverClasses = (color: string = 'primary') => {
  const colorMap: Record<string, string> = {
    blue: 'hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400',
    purple: 'hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400',
    amber: 'hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400',
    green: 'hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400',
    pink: 'hover:bg-pink-500/10 hover:text-pink-600 dark:hover:text-pink-400',
    primary: 'hover:bg-primary/10 hover:text-primary',
  }
  return colorMap[color] || colorMap.primary
}

export function AppSidebar() {
  const groups = useMemo(() => navGroups, [])
  const location = useLocation()
  const queryClient = useQueryClient()
  const { expandedGroups, setExpandedGroup } = useUiStore()

  // Auto-expand groups when navigating to their pages (only if not explicitly collapsed by user)
  useEffect(() => {
    groups.forEach((group) => {
      const hasActiveItem = group.items.some((item) =>
        item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
      )

      // Only auto-expand if group was never explicitly set by user (undefined in store)
      if (hasActiveItem && expandedGroups[group.label] === undefined) {
        setExpandedGroup(group.label, true)
      }
    })
  }, [location.pathname, groups, expandedGroups, setExpandedGroup])

  // Fetch sidebar counts
  const { data: counts } = useQuery<SidebarCounts>({
    queryKey: ['sidebar-counts'],
    queryFn: () => statsService.getSidebarCounts(),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // WebSocket integration for real-time updates
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost/ws'
    const ws = new WebSocket(`${wsUrl}?topics=analysis,proposals,noise_filtering`)

    ws.onopen = () => {
      logger.debug('[Sidebar] WebSocket connected for counts')
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

        if (
          topic === 'noise_filtering' &&
          ['message_scored', 'batch_scored'].includes(eventType)
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
      logger.debug('[Sidebar] WebSocket disconnected')
    }

    return () => {
      ws.close()
    }
  }, [queryClient])


  return (
    <Sidebar collapsible="icon">
        <SidebarHeader className="h-[56px] px-2 border-b border-border flex items-center">
          <div className="flex w-full items-center gap-3 px-2 group-data-[collapsible=icon]:justify-center">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
              <SignalIcon className="size-4" />
            </div>
            <span className="text-sm font-semibold group-data-[collapsible=icon]:hidden">
              {import.meta.env.VITE_APP_NAME || 'Pulse Radar'}
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          {groups.map((group, groupIndex) => {
            // Check if group has nested routes (multiple items or items with paths starting from same base)
            const hasNestedRoutes = group.items.length > 1 && group.items.some((item) => item.path !== '/')
            const isGroupExpanded = expandedGroups[group.label] ?? false
            const hasActiveItem = group.items.some((item) =>
              item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
            )

            // Make collapsible if it has nested routes
            if (hasNestedRoutes) {
              return (
                <Fragment key={group.label}>
                  <Collapsible
                    open={isGroupExpanded}
                    onOpenChange={(open) => setExpandedGroup(group.label, open)}
                    className="group/collapsible"
                  >
                    <SidebarGroup className="group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:p-1">
                      <SidebarGroupLabel
                        asChild
                        className="px-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/70"
                      >
                        <CollapsibleTrigger
                          className={cn(
                            'flex w-full items-center justify-between rounded-md transition-colors hover:bg-accent/50',
                            hasActiveItem && 'text-primary font-semibold'
                          )}
                        >
                          <span>{group.label}</span>
                          <ChevronRightIcon
                            className={cn(
                              'h-4 w-4 transition-transform duration-200 group-data-[collapsible=icon]:hidden',
                              isGroupExpanded && 'rotate-90'
                            )}
                          />
                        </CollapsibleTrigger>
                      </SidebarGroupLabel>
                      <CollapsibleContent className="group-data-[collapsible=icon]:hidden justify-center">
                        <SidebarGroupContent>
                          <SidebarMenu>
                            {group.items.map((item) => {
                              const isActive =
                                item.path === '/'
                                  ? location.pathname === '/'
                                  : location.pathname.startsWith(item.path)

                              return (
                                <SidebarMenuItem key={item.path}>
                                  <SidebarMenuButton
                                    asChild
                                    isActive={isActive}
                                    tooltip={item.label}
                                    className={cn(
                                      'relative transition-all duration-300',
                                      'data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold',
                                      !isActive && getHoverClasses(group.hoverColor)
                                    )}
                                  >
                                    <Link to={item.path}>
                                      <item.icon className="size-5" />
                                      <span>{item.label}</span>
                                    </Link>
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                              )
                            })}
                          </SidebarMenu>
                        </SidebarGroupContent>
                      </CollapsibleContent>
                      <SidebarGroupContent className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-2 group-data-[collapsible=icon]:p-0">
                        <SidebarMenu className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-2">
                          {group.items.map((item) => {
                            const isActive =
                              item.path === '/'
                                ? location.pathname === '/'
                                : location.pathname.startsWith(item.path)

                            return (
                              <SidebarMenuItem
                                key={`collapsed-${item.path}`}
                                className="group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:flex-none"
                              >
                                <SidebarMenuButton
                                  asChild
                                  isActive={isActive}
                                  tooltip={item.label}
                                  className={cn(
                                    'relative transition-all duration-300',
                                    'data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold',
                                    'group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:w-11 group-data-[collapsible=icon]:h-11 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0',
                                    !isActive && getHoverClasses(group.hoverColor)
                                  )}
                                >
                                  <Link to={item.path}>
                                    <item.icon className="size-5" />
                                    <span className="group-data-[collapsible=icon]:sr-only">{item.label}</span>
                                  </Link>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            )
                          })}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </SidebarGroup>
                  </Collapsible>
                  {groupIndex < groups.length - 1 && (
                    <Separator className="hidden group-data-[collapsible=icon]:block !w-auto mx-3 my-2" />
                  )}
                </Fragment>
              )
            }

            // Regular group rendering for non-collapsible groups
            return (
              <Fragment key={group.label}>
                <SidebarGroup>
                  <SidebarGroupLabel
                    className={cn(
                      'px-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/70',
                      hasActiveItem && 'text-primary'
                    )}
                  >
                    {group.label}
                  </SidebarGroupLabel>
                  <SidebarGroupContent className="group-data-[collapsible=icon]:p-0">
                    <SidebarMenu className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-2">
                      {group.items.map((item) => {
                        const isActive =
                          item.path === '/'
                            ? location.pathname === '/'
                            : location.pathname.startsWith(item.path)

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
                            <div className="flex items-center gap-2 w-full relative group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
                              <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                tooltip={item.label}
                                className={cn(
                                  'flex-1 relative transition-all duration-300',
                                  'data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold',
                                  'group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:w-11 group-data-[collapsible=icon]:h-11 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0',
                                  !isActive && getHoverClasses(group.hoverColor)
                                )}
                              >
                                <Link to={item.path}>
                                  <item.icon className="size-5" />
                                  <span className="group-data-[collapsible=icon]:sr-only">{item.label}</span>
                                </Link>
                              </SidebarMenuButton>
                              <NotificationBadge
                                count={badgeCount || 0}
                                tooltip={badgeTooltip}
                                className={cn(
                                  'absolute right-2',
                                  isActive && 'bg-primary text-white dark:bg-primary dark:text-white border-primary'
                                )}
                              />
                            </div>
                          </SidebarMenuItem>
                        )
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                  {group.action && (
                    <div className="px-2 mt-2 group-data-[collapsible=icon]:px-1">
                      <GlobalKnowledgeExtractionDialog />
                    </div>
                  )}
                </SidebarGroup>
                {groupIndex < groups.length - 1 && (
                  <Separator className="hidden group-data-[collapsible=icon]:block !w-auto mx-3 my-2" />
                )}
              </Fragment>
            )
          })}
        </SidebarContent>
      </Sidebar>
  )
}
