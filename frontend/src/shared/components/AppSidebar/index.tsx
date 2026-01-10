import { useMemo, useEffect, useRef, ReactNode } from 'react'
import { useUiStore } from '@/shared/store/uiStore'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  useSidebar,
} from '@/shared/ui/sidebar'
import type { SidebarCounts } from '@/shared/api/statsService'
import { Logo } from '@/shared/components/Logo'
import { defaultNavGroups } from '@/shared/config/navigation'
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
  /** Custom navigation groups. Defaults to defaultNavGroups from config. */
  navGroups?: NavGroup[]
  /** Slot for knowledge extraction dialog (injected from MainLayout to avoid boundary violation) */
  knowledgeExtractionSlot?: ReactNode
}

export function AppSidebar({
  mobile = false,
  counts: _counts,
  currentPath,
  className,
  navGroups = defaultNavGroups,
  knowledgeExtractionSlot,
}: AppSidebarProps) {
  const groups = useMemo(() => navGroups, [navGroups])
  const { setExpandedGroup } = useUiStore()
  const { state } = useSidebar() // For logo collapsed state
  const initializedGroupsRef = useRef<Set<string>>(new Set())

  // Auto-expand groups containing active item (runs once per group)
  useEffect(() => {
    groups.forEach((group) => {
      const groupKey = getGroupKey(group)

      // Skip if already initialized this group
      if (initializedGroupsRef.current.has(groupKey)) return

      const hasActiveItem = group.items.some((item) =>
        item.path === '/dashboard' ? currentPath === '/dashboard' : currentPath.startsWith(item.path)
      )

      if (hasActiveItem) {
        initializedGroupsRef.current.add(groupKey)
        setExpandedGroup(groupKey, true)
      }
    })
  }, [currentPath, groups, setExpandedGroup])

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
              {knowledgeExtractionSlot && (
                <div className="px-4 mt-2">
                  {knowledgeExtractionSlot}
                </div>
              )}
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
        {/* Knowledge Extraction slot (injected from MainLayout) */}
        {knowledgeExtractionSlot && (
          <div className="mt-auto px-4 pb-4">
            <div className="pt-4 border-t border-sidebar-border">
              {knowledgeExtractionSlot}
            </div>
          </div>
        )}
      </SidebarContent>

    </Sidebar>
  )
}
