import { useMemo, useEffect } from 'react'
import {
  LayoutGrid,
  Cpu,
  Mail,
  MessageSquare,
  List,
  Folder,
  Settings,
  PanelLeft,
} from 'lucide-react'
import { useLocation, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useUiStore } from '@/shared/store/uiStore'
import { logger } from '@/shared/utils/logger'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/shared/ui/sidebar'
import { Separator } from '@/shared/ui/separator'
import { statsService, type SidebarCounts } from '@/shared/api/statsService'
import { Logo } from '@/shared/components/Logo'
import { NavMain } from './NavMain'
import type { NavGroup } from './types'

interface AppSidebarProps {
  mobile?: boolean
}

const navGroups: NavGroup[] = [
  {
    label: 'Data Management',
    items: [
      { path: '/dashboard', label: 'Overview', icon: LayoutGrid },
      { path: '/messages', label: 'Messages', icon: Mail },
      { path: '/topics', label: 'Topics', icon: MessageSquare },
    ],
  },
  // DORMANT: AI Operations (F014 Noise Filtering) - приховано до v1.1+
  // {
  //   label: 'AI Operations',
  //   items: [
  //     { path: '/noise-filtering', label: 'Noise Filtering', icon: FunnelIcon },
  //   ],
  //   action: true,
  // },
  {
    label: 'AI Setup',
    items: [
      { path: '/agents', label: 'Agents', icon: Cpu },
      { path: '/agent-tasks', label: 'Task Templates', icon: List },
      { path: '/projects', label: 'Projects', icon: Folder },
    ],
  },
  // DORMANT: Automation (F015, F016) - приховано до v1.2+
  // {
  //   label: 'Automation',
  //   items: [
  //     { path: '/automation/dashboard', label: 'Overview', icon: SparklesIcon },
  //     { path: '/automation/rules', label: 'Rules', icon: Cog6ToothIcon },
  //     { path: '/automation/scheduler', label: 'Scheduler', icon: CalendarIcon },
  //   ],
  // },
]

export function AppSidebar({ mobile = false }: AppSidebarProps = {}) {
  const groups = useMemo(() => navGroups, [])
  const location = useLocation()
  const queryClient = useQueryClient()
  const { expandedGroups, setExpandedGroup } = useUiStore()
  const { state, toggleSidebar } = useSidebar() // For logo collapsed state + toggle

  useEffect(() => {
    groups.forEach((group) => {
      const hasActiveItem = group.items.some((item) =>
        item.path === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(item.path)
      )

      if (hasActiveItem && expandedGroups[group.label] === undefined) {
        setExpandedGroup(group.label, true)
      }
    })
  }, [location.pathname, groups, expandedGroups, setExpandedGroup])

  const { data: _counts } = useQuery<SidebarCounts>({
    queryKey: ['sidebar-counts'],
    queryFn: () => statsService.getSidebarCounts(),
    refetchInterval: 30000,
  })

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

  // DORMANT: AI Operations group приховано
  // const aiOperationsGroup = groups.find((g) => g.label === 'AI Operations')

  if (mobile) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto py-2">
          <NavMain groups={groups} />
          {/* DORMANT: AI Operations + Extract Knowledge button приховано
          {aiOperationsGroup && (
            <>
              <div className="px-2">
                <div className="space-y-1">
                  {aiOperationsGroup.items.map((item) => (
                    <NavNotifications
                      key={item.path}
                      item={item}
                      counts={counts}
                    />
                  ))}
                </div>
              </div>
              <div className="px-4 mt-2">
                <GlobalKnowledgeExtractionDialog />
              </div>
            </>
          )}
          */}
        </div>
      </div>
    )
  }

  return (
    <Sidebar collapsible="icon" data-testid="app-sidebar">
      {/* Logo Header - full-height sidebar pattern */}
      <SidebarHeader className="h-14 border-b border-sidebar-border flex items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0">
        <Logo
          collapsed={state === 'collapsed'}
          size="sm"
          animated
        />
      </SidebarHeader>

      <SidebarContent>
        <NavMain groups={groups} />
        {/* DORMANT: AI Operations + Extract Knowledge button приховано
        {aiOperationsGroup && (
          <>
            <SidebarGroupContent className="group-data-[collapsible=icon]:p-0">
              <SidebarMenu className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-2">
                {aiOperationsGroup.items.map((item) => (
                  <NavNotifications
                    key={item.path}
                    item={item}
                    counts={counts}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
            <div className="px-2 mt-2 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
              <GlobalKnowledgeExtractionDialog />
            </div>
          </>
        )}
        */}
      </SidebarContent>

      {/* Footer with Settings link + Collapse toggle */}
      <SidebarFooter className="group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:items-center">
        <Separator className="mb-2 group-data-[collapsible=icon]:hidden" />
        <SidebarMenu className="group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-2">
          <SidebarMenuItem className="group-data-[collapsible=icon]:w-auto">
            <SidebarMenuButton
              asChild
              tooltip="Settings"
              className="group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
            >
              <Link to="/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="group-data-[collapsible=icon]:hidden">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {/* Collapse toggle - moved from Navbar */}
          <SidebarMenuItem className="group-data-[collapsible=icon]:w-auto">
            <SidebarMenuButton
              tooltip="Toggle sidebar"
              onClick={toggleSidebar}
              className="group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
            >
              <PanelLeft className="h-4 w-4" />
              <span className="group-data-[collapsible=icon]:hidden">Toggle Sidebar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
