import { useMemo, useEffect } from 'react'
import {
  LayoutGrid,
  Cpu,
  Mail,
  MessageSquare,
  List,
  Folder,
  Atom,
  ClipboardList,
  Gauge,
} from 'lucide-react'
import { useUiStore } from '@/shared/store/uiStore'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  useSidebar,
} from '@/shared/ui/sidebar'
import type { SidebarCounts } from '@/shared/api/statsService'
import { Logo } from '@/shared/components/Logo'
import { NavMain } from './NavMain'
import type { NavGroup } from './types'

// Helper to get unique key for React (prefer labelKey, fallback to label)
function getGroupKey(group: NavGroup): string {
  return group.labelKey || group.label || group.items[0]?.path || 'group'
}

interface AppSidebarProps {
  mobile?: boolean
  counts?: SidebarCounts
  currentPath: string
  className?: string
}

const navGroups: NavGroup[] = [
  {
    labelKey: 'sidebar.groups.dataManagement',
    items: [
      { path: '/dashboard', labelKey: 'sidebar.items.overview', icon: LayoutGrid },
      { path: '/executive-summary', labelKey: 'sidebar.items.executiveSummary', icon: ClipboardList },
      { path: '/messages', labelKey: 'sidebar.items.messages', icon: Mail },
      { path: '/atoms', labelKey: 'sidebar.items.atoms', icon: Atom },
      { path: '/topics', labelKey: 'sidebar.items.topics', icon: MessageSquare },
    ],
  },
  // DORMANT: AI Operations (F014 Noise Filtering) - приховано до v1.1+
  // {
  //   labelKey: 'sidebar.groups.aiOperations',
  //   items: [
  //     { path: '/noise-filtering', labelKey: 'sidebar.items.noiseFiltering', icon: FunnelIcon },
  //   ],
  //   action: true,
  // },
  {
    labelKey: 'sidebar.groups.aiSetup',
    items: [
      { path: '/agents', labelKey: 'sidebar.items.agents', icon: Cpu },
      { path: '/agent-tasks', labelKey: 'sidebar.items.taskTemplates', icon: List },
      { path: '/projects', labelKey: 'sidebar.items.projects', icon: Folder },
    ],
  },
  {
    labelKey: 'sidebar.groups.monitoring',
    items: [
      { path: '/performance', labelKey: 'sidebar.items.performance', icon: Gauge },
    ],
  },
  // DORMANT: Automation (F015, F016) - приховано до v1.2+
  // {
  //   labelKey: 'sidebar.groups.automation',
  //   items: [
  //     { path: '/automation/dashboard', labelKey: 'sidebar.items.overview', icon: SparklesIcon },
  //     { path: '/automation/rules', labelKey: 'sidebar.items.rules', icon: Cog6ToothIcon },
  //     { path: '/automation/scheduler', labelKey: 'sidebar.items.scheduler', icon: CalendarIcon },
  //   ],
  // },
]

export function AppSidebar({ mobile = false, counts: _counts, currentPath, className }: AppSidebarProps) {
  const groups = useMemo(() => navGroups, [])
  const { expandedGroups, setExpandedGroup } = useUiStore()
  const { state } = useSidebar() // For logo collapsed state

  // Auto-expand groups containing active item
  useEffect(() => {
    groups.forEach((group) => {
      const groupKey = getGroupKey(group)
      const hasActiveItem = group.items.some((item) =>
        item.path === '/dashboard' ? currentPath === '/dashboard' : currentPath.startsWith(item.path)
      )

      if (hasActiveItem && expandedGroups[groupKey] === undefined) {
        setExpandedGroup(groupKey, true)
      }
    })
  }, [currentPath, groups, expandedGroups, setExpandedGroup])

  // DORMANT: AI Operations group приховано
  // const aiOperationsGroup = groups.find((g) => g.label === 'AI Operations')

  if (mobile) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto py-2">
          <NavMain groups={groups} currentPath={currentPath} />
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
    <Sidebar collapsible="icon" data-testid="app-sidebar" className={className}>
      {/* Logo Header - override flex-col to flex-row, flush left */}
      <SidebarHeader className="!flex-row h-16 items-center pl-4 pr-2 mb-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:mb-0">
        <Logo
          collapsed={state === 'collapsed'}
          size="md"
          animated={false}
        />
      </SidebarHeader>

      <SidebarContent>
        <NavMain groups={groups} currentPath={currentPath} />
      </SidebarContent>

    </Sidebar>
  )
}
