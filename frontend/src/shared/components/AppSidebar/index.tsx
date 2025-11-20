import { useMemo, useEffect } from 'react'
import {
  Squares2X2Icon,
  Cog6ToothIcon,
  SignalIcon,
  CpuChipIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  ListBulletIcon,
  FolderIcon,
  FunnelIcon,
  CalendarIcon,
  SparklesIcon,
} from '@heroicons/react/24/solid'
import { useLocation } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useUiStore } from '@/shared/store/uiStore'
import { logger } from '@/shared/utils/logger'
import {
  Sidebar,
  SidebarContent,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
} from '@/shared/ui/sidebar'
import { statsService, type SidebarCounts } from '@/shared/api/statsService'
import { GlobalKnowledgeExtractionDialog } from '@/features/knowledge'
import { NavMain } from './NavMain'
import { NavNotifications } from './NavNotifications'
import type { NavGroup } from './types'

interface AppSidebarProps {
  mobile?: boolean
}

const navGroups: NavGroup[] = [
  {
    label: 'Data Management',
    hoverColor: 'blue',
    items: [
      { path: '/dashboard', label: 'Overview', icon: Squares2X2Icon },
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
    ],
  },
]

export function AppSidebar({ mobile = false }: AppSidebarProps = {}) {
  const groups = useMemo(() => navGroups, [])
  const location = useLocation()
  const queryClient = useQueryClient()
  const { expandedGroups, setExpandedGroup } = useUiStore()

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

  const { data: counts } = useQuery<SidebarCounts>({
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

  const aiOperationsGroup = groups.find((g) => g.label === 'AI Operations')

  if (mobile) {
    return (
      <div className="flex flex-col h-full">
        <div className="h-14 px-4 border-b border-border flex items-center">
          <div className="flex w-full items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
              <SignalIcon className="size-4" />
            </div>
            <span className="text-sm font-semibold">
              {import.meta.env.VITE_APP_NAME || 'Pulse Radar'}
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <NavMain groups={groups.filter((g) => g.label !== 'AI Operations')} />

          {aiOperationsGroup && (
            <>
              <div className="px-2">
                <div className="space-y-1">
                  {aiOperationsGroup.items.map((item) => (
                    <NavNotifications
                      key={item.path}
                      item={item}
                      counts={counts}
                      hoverColor={aiOperationsGroup.hoverColor}
                    />
                  ))}
                </div>
              </div>
              <div className="px-4 mt-2">
                <GlobalKnowledgeExtractionDialog />
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 px-2 border-b border-border flex items-center">
        <div className="flex w-full items-center gap-3 px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
            <SignalIcon className="size-4" />
          </div>
          <span className="text-sm font-semibold group-data-[collapsible=icon]:hidden">
            {import.meta.env.VITE_APP_NAME || 'Pulse Radar'}
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={groups.filter((g) => g.label !== 'AI Operations')} />

        {aiOperationsGroup && (
          <>
            <SidebarGroupContent className="group-data-[collapsible=icon]:p-0">
              <SidebarMenu className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-2">
                {aiOperationsGroup.items.map((item) => (
                  <NavNotifications
                    key={item.path}
                    item={item}
                    counts={counts}
                    hoverColor={aiOperationsGroup.hoverColor}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
            <div className="px-2 mt-2 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
              <GlobalKnowledgeExtractionDialog />
            </div>
          </>
        )}
      </SidebarContent>
    </Sidebar>
  )
}
