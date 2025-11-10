import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/shared/lib/utils'
import { NotificationBadge } from '@/shared/ui'
import {
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/shared/ui/sidebar'
import type { NavItem } from './types'
import type { SidebarCounts } from '@/shared/api/statsService'

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

interface NavNotificationsProps {
  item: NavItem;
  counts?: SidebarCounts;
  hoverColor?: string;
}

export function NavNotifications({ item, counts, hoverColor }: NavNotificationsProps) {
  const location = useLocation()
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
            'group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0',
            !isActive && getHoverClasses(hoverColor)
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
}
