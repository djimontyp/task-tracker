import { Link, useLocation } from 'react-router-dom'
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
import { Separator } from '@/shared/ui/separator'
import type { NavGroup } from './types'

const HOVER_CLASSES = 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'

interface NavMainProps {
  groups: NavGroup[];
}

export function NavMain({ groups }: NavMainProps) {
  const location = useLocation()
  const { expandedGroups, setExpandedGroup } = useUiStore()

  return (
    <>
      {groups.map((group, groupIndex) => {
        const hasNestedRoutes = group.items.length > 1 && group.items.some((item) => item.path !== '/')
        const isGroupExpanded = expandedGroups[group.label] ?? false
        const hasActiveItem = group.items.some((item) =>
          item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
        )

        if (hasNestedRoutes) {
          return (
            <Fragment key={group.label}>
              <Collapsible
                open={isGroupExpanded}
                onOpenChange={(open) => setExpandedGroup(group.label, open)}
                className="group/collapsible"
              >
                <SidebarGroup className="group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:p-2">
                  <SidebarGroupLabel
                    asChild
                    className="px-2 text-xs font-semibold uppercase tracking-wider text-foreground"
                  >
                    <CollapsibleTrigger
                      className={cn(
                        'flex w-full items-center justify-between rounded-md transition-colors hover:bg-accent/50',
                        hasActiveItem && 'text-foreground font-semibold'
                      )}
                    >
                      <span>{group.label}</span>
                      <ChevronRight
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
                                  'data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:font-semibold',
                                  !isActive && HOVER_CLASSES
                                )}
                              >
                                <Link to={item.path} className="flex items-center gap-2">
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
                  <SidebarGroupContent className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0">
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
                                'group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0',
                                !isActive && HOVER_CLASSES
                              )}
                            >
                              <Link to={item.path} className="flex items-center gap-2">
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
                <Separator className="hidden group-data-[collapsible=icon]:block !w-auto mx-4 my-2" />
              )}
            </Fragment>
          )
        }

        return (
          <Fragment key={group.label}>
            <SidebarGroup>
              <SidebarGroupLabel
                className={cn(
                  'px-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground',
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

                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.label}
                          className={cn(
                            'relative transition-all duration-300',
                            'data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold',
                            'group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0',
                            !isActive && HOVER_CLASSES
                          )}
                        >
                          <Link to={item.path} className="flex items-center gap-2">
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
            {groupIndex < groups.length - 1 && (
              <Separator className="hidden group-data-[collapsible=icon]:block !w-auto mx-4 my-2" />
            )}
          </Fragment>
        )
      })}
    </>
  )
}
