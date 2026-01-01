import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import { Fragment } from 'react'
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
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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

  return (
    <nav aria-label="Main navigation">
      {groups.map((group) => {
        const groupKey = getGroupKey(group)
        const hasNestedRoutes = group.items.length > 1 && group.items.some((item) => item.path !== '/')
        const isGroupExpanded = expandedGroups[groupKey] ?? false

        if (hasNestedRoutes) {
          return (
            <Fragment key={groupKey}>
              <Collapsible
                open={isGroupExpanded}
                onOpenChange={(open) => setExpandedGroup(groupKey, open)}
                className="group/collapsible"
              >
                <SidebarGroup className="py-2">
                  <SidebarGroupLabel
                    asChild
                    className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/60"
                  >
                    <CollapsibleTrigger
                      aria-expanded={isGroupExpanded}
                      className={cn(
                        'flex w-full items-center justify-between rounded-md py-0.5 transition-colors',
                        'hover:text-sidebar-foreground',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring'
                      )}
                    >
                      <span>{getLabel(t, group.label, group.labelKey)}</span>
                      <ChevronRight
                        aria-hidden="true"
                        className={cn(
                          'h-4 w-4 shrink-0 text-sidebar-foreground/40 transition-transform duration-200',
                          isGroupExpanded && 'rotate-90'
                        )}
                      />
                    </CollapsibleTrigger>
                  </SidebarGroupLabel>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu className="gap-0.5">
                        {group.items.map((item) => {
                          const isActive =
                            item.path === '/'
                              ? currentPath === '/'
                              : currentPath.startsWith(item.path)

                          return (
                            <SidebarMenuItem key={item.path}>
                              <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                tooltip={getLabel(t, item.label, item.labelKey)}
                                className={cn(
                                  'relative h-10 transition-colors duration-150',
                                  isActive && [
                                    'bg-sidebar-accent text-sidebar-accent-foreground font-medium',
                                    'before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2',
                                    'before:h-6 before:w-1 before:rounded-r-full before:bg-sidebar-primary',
                                  ]
                                )}
                              >
                                <Link to={item.path} className="flex items-center gap-2">
                                  <item.icon
                                    aria-hidden="true"
                                    className={cn(
                                      'h-[18px] w-[18px] shrink-0',
                                      isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/70'
                                    )}
                                  />
                                  <span className="truncate">{getLabel(t, item.label, item.labelKey)}</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          )
                        })}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            </Fragment>
          )
        }

        return (
          <Fragment key={groupKey}>
            <SidebarGroup className="py-2">
              <SidebarGroupLabel
                className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/60"
              >
                {getLabel(t, group.label, group.labelKey)}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {group.items.map((item) => {
                    const isActive =
                      item.path === '/'
                        ? currentPath === '/'
                        : currentPath.startsWith(item.path)

                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={getLabel(t, item.label, item.labelKey)}
                          className={cn(
                            'relative h-10 transition-colors duration-150',
                            isActive && [
                              'bg-sidebar-accent text-sidebar-accent-foreground font-medium',
                              'before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2',
                              'before:h-6 before:w-1 before:rounded-r-full before:bg-sidebar-primary',
                            ]
                          )}
                        >
                          <Link to={item.path} className="flex items-center gap-2">
                            <item.icon
                              aria-hidden="true"
                              className={cn(
                                'h-[18px] w-[18px] shrink-0',
                                isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/70'
                              )}
                            />
                            <span className="truncate">{getLabel(t, item.label, item.labelKey)}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </Fragment>
        )
      })}
    </nav>
  )
}
