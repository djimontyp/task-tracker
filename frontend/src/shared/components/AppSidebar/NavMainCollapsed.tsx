import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/utils'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/shared/ui/sidebar'
import type { NavGroup } from './types'

const HOVER_CLASSES = 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'

interface NavMainCollapsedProps {
  groups: NavGroup[];
}

export function NavMainCollapsed({ groups }: NavMainCollapsedProps) {
  const { t } = useTranslation('common')
  const location = useLocation()

  // Flatten all items from all groups
  const allItems = groups.flatMap((group) => group.items)

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <SidebarMenu className="flex flex-col items-center gap-2">
        {allItems.map((item) => {
          const isActive =
            item.path === '/dashboard'
              ? location.pathname === '/dashboard'
              : location.pathname.startsWith(item.path)

          return (
            <SidebarMenuItem key={item.path} className="w-auto flex justify-center">
              <SidebarMenuButton
                asChild
                isActive={isActive}
                tooltip={t(item.labelKey)}
                className={cn(
                  'size-11 p-0 transition-all duration-200',
                  'data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-medium',
                  !isActive && HOVER_CLASSES
                )}
              >
                <Link
                  to={item.path}
                  className="flex items-center justify-center size-full"
                >
                  <item.icon className="size-5 shrink-0" />
                  <span className="sr-only">{t(item.labelKey)}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </div>
  )
}
