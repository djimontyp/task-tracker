import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/utils'
import { NotificationBadge } from '@/shared/ui'
import {
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/shared/ui/sidebar'
import type { NavItem } from './types'
import type { SidebarCounts } from '@/shared/api/statsService'

const HOVER_CLASSES = 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'

interface NavNotificationsProps {
  item: NavItem;
  counts?: SidebarCounts;
}

export function NavNotifications({ item, counts }: NavNotificationsProps) {
  const { t } = useTranslation('common')
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
          tooltip={t(item.labelKey)}
          className={cn(
            'flex-1 relative transition-all duration-300',
            'data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold',
            'group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0',
            !isActive && HOVER_CLASSES
          )}
        >
          <Link to={item.path}>
            <item.icon className="size-5" />
            <span className="group-data-[collapsible=icon]:sr-only">{t(item.labelKey)}</span>
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
