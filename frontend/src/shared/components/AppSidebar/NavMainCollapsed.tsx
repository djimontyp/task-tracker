import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/utils'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/shared/ui/sidebar'
import type { NavGroup, NavItem } from './types'

const HOVER_CLASSES = 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'

// Helper to get display label (direct label or translated key)
function getLabel(t: (key: string) => string, item: NavItem): string {
  return item.label || (item.labelKey ? t(item.labelKey) : '')
}

interface NavMainCollapsedProps {
  groups: NavGroup[];
  currentPath: string;
}

export function NavMainCollapsed({ groups, currentPath }: NavMainCollapsedProps) {
  const { t } = useTranslation('common')

  // Flatten all items from all groups
  const allItems = groups.flatMap((group) => group.items)

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <SidebarMenu className="flex flex-col items-center gap-2">
        {allItems.map((item) => {
          const isActive =
            item.path === '/dashboard'
              ? currentPath === '/dashboard'
              : currentPath.startsWith(item.path)

          return (
            <SidebarMenuItem key={item.path} className="w-auto flex justify-center">
              <SidebarMenuButton
                asChild
                isActive={isActive}
                tooltip={getLabel(t, item)}
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
                  <span className="sr-only">{getLabel(t, item)}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </div>
  )
}
