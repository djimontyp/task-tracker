import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useUiStore } from '@/shared/store/uiStore'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/shared/ui/sidebar'
import type { NavGroup } from './types'

interface NavMainProps {
  groups: NavGroup[];
  currentPath: string;
}

// Helper to get display label (direct label or translated key)
function getLabel(t: (key: string) => string, label?: string, labelKey?: string): string {
  return label || (labelKey ? t(labelKey) : '')
}

// Helper to get unique key for React (prefer labelKey, fallback to label)
function getGroupKey(group: NavGroup): string {
  return group.labelKey || group.label || group.items[0]?.path || 'group'
}

export function NavMain({ groups, currentPath }: NavMainProps) {
  const { t } = useTranslation('common')
  const { expandedGroups, setExpandedGroup } = useUiStore()
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  return (
    <nav aria-label="Main navigation">
      {groups.map((group) => {
        const groupKey = getGroupKey(group)
        const hasNestedRoutes = group.items.length > 1 && group.items.some((item) => item.path !== '/')
        const isGroupExpanded = expandedGroups[groupKey] ?? false

        // Wrapper for collapsible groups
        const GroupWrapper = hasNestedRoutes ? Collapsible : 'div'
        const groupWrapperProps = hasNestedRoutes ? {
          open: isGroupExpanded,
          onOpenChange: (open: boolean) => setExpandedGroup(groupKey, open),
          className: 'group/collapsible',
        } : {}

        return (
          <GroupWrapper key={groupKey} {...groupWrapperProps}>
            <SidebarGroup
              className={cn(
                'py-2 transition-all duration-200',
                isCollapsed && 'py-1 flex flex-col items-center'
              )}
            >
              {/* Group label - animates out when collapsed */}
              {hasNestedRoutes ? (
                <CollapsibleTrigger
                  aria-expanded={isGroupExpanded}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md py-0.5 px-2 mb-2',
                    'text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/60',
                    'transition-all duration-200 ease-linear',
                    'hover:text-sidebar-foreground',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                    // Collapsed: hide label smoothly
                    isCollapsed && 'h-0 mb-0 py-0 opacity-0 overflow-hidden pointer-events-none'
                  )}
                >
                  <span className="truncate">{getLabel(t, group.label, group.labelKey)}</span>
                  <ChevronRight
                    aria-hidden="true"
                    className={cn(
                      'h-4 w-4 shrink-0 text-sidebar-foreground/40 transition-transform duration-200',
                      isGroupExpanded && 'rotate-90'
                    )}
                  />
                </CollapsibleTrigger>
              ) : (
                <div
                  className={cn(
                    'mb-2 px-2 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/60',
                    'transition-all duration-200 ease-linear',
                    // Collapsed: hide label smoothly
                    isCollapsed && 'h-0 mb-0 py-0 opacity-0 overflow-hidden'
                  )}
                >
                  {getLabel(t, group.label, group.labelKey)}
                </div>
              )}

              {/* Menu items - wrapped in CollapsibleContent for collapsible groups */}
              {hasNestedRoutes ? (
                <CollapsibleContent
                  className={cn(
                    'transition-all duration-200',
                    // When collapsed, show content always (no accordion behavior)
                    isCollapsed && 'data-[state=closed]:block'
                  )}
                  // Force open when sidebar is collapsed to show icons
                  forceMount={isCollapsed ? true : undefined}
                >
                  <SidebarGroupContent>
                    <MenuItems
                      items={group.items}
                      currentPath={currentPath}
                      isCollapsed={isCollapsed}
                      t={t}
                    />
                  </SidebarGroupContent>
                </CollapsibleContent>
              ) : (
                <SidebarGroupContent>
                  <MenuItems
                    items={group.items}
                    currentPath={currentPath}
                    isCollapsed={isCollapsed}
                    t={t}
                  />
                </SidebarGroupContent>
              )}
            </SidebarGroup>
          </GroupWrapper>
        )
      })}
    </nav>
  )
}

// Extracted menu items component for reuse
interface MenuItemsProps {
  items: NavGroup['items'];
  currentPath: string;
  isCollapsed: boolean;
  t: (key: string) => string;
}

function MenuItems({ items, currentPath, isCollapsed, t }: MenuItemsProps) {
  return (
    <SidebarMenu
      className={cn(
        'gap-0.5 transition-all duration-200',
        isCollapsed && 'gap-1 flex flex-col items-center'
      )}
    >
      {items.map((item) => {
        const isActive =
          item.path === '/dashboard'
            ? currentPath === '/dashboard'
            : currentPath.startsWith(item.path)

        return (
          <SidebarMenuItem
            key={item.path}
            className={cn(
              'transition-all duration-200',
              isCollapsed && 'w-auto flex justify-center'
            )}
          >
            <SidebarMenuButton
              asChild
              isActive={isActive}
              tooltip={getLabel(t, item.label, item.labelKey)}
              className={cn(
                'relative transition-all duration-200',
                // Expanded state
                !isCollapsed && [
                  'h-10',
                  isActive && [
                    'bg-sidebar-accent text-sidebar-accent-foreground font-medium',
                    'before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2',
                    'before:h-6 before:w-1 before:rounded-r-full before:bg-sidebar-primary',
                  ],
                ],
                // Collapsed state
                isCollapsed && [
                  'size-11 p-0',
                  isActive && 'bg-primary/10 text-primary font-medium',
                ]
              )}
            >
              <Link
                to={item.path}
                className={cn(
                  'flex items-center transition-all duration-200',
                  !isCollapsed && 'gap-2',
                  isCollapsed && 'justify-center size-full'
                )}
              >
                <item.icon
                  aria-hidden="true"
                  className={cn(
                    'shrink-0 transition-all duration-200',
                    !isCollapsed && 'h-[18px] w-[18px]',
                    isCollapsed && 'size-5',
                    isActive
                      ? (isCollapsed ? 'text-primary' : 'text-sidebar-primary')
                      : 'text-sidebar-foreground/70'
                  )}
                />
                {/* Text - smoothly hides when collapsed */}
                <span
                  className={cn(
                    'truncate transition-all duration-200 ease-linear',
                    isCollapsed && 'w-0 opacity-0 overflow-hidden sr-only'
                  )}
                >
                  {getLabel(t, item.label, item.labelKey)}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}
