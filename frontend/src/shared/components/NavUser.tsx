import { BadgeCheck, LogOut, Settings, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { Switch } from '@/shared/ui/switch'

interface NavUserProps {
  user: {
    name: string
    email: string
    avatar?: string
  }
  /** Show Admin Mode toggle */
  isAdminMode?: boolean
  /** Handler for Admin Mode toggle */
  onToggleAdminMode?: () => void
}

/**
 * NavUser - User menu dropdown for Navbar.
 *
 * Includes:
 * - User avatar and info
 * - Account link
 * - Settings link
 * - Admin Mode toggle (optional)
 * - Logout
 */
export function NavUser({
  user,
  isAdminMode,
  onToggleAdminMode,
}: NavUserProps) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t('userMenu.ariaLabel')}
        >
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="rounded-lg text-xs">
              {user.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-56 rounded-lg"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="rounded-lg">
                {user.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <BadgeCheck className="mr-2 h-4 w-4" />
            {t('userMenu.account')}
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/settings" className="flex items-center">
              <Settings className="mr-2 h-4 w-4" />
              {t('userMenu.settings')}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        {onToggleAdminMode && (
          <>
            <DropdownMenuSeparator />
            <div className="flex items-center justify-between px-2 py-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{t('userMenu.adminMode')}</span>
                <kbd className="ml-2 text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono">
                  ⌘⇧A
                </kbd>
              </div>
              <Switch
                checked={isAdminMode}
                onCheckedChange={onToggleAdminMode}
                aria-label={t('userMenu.toggleAdminMode')}
              />
            </div>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          {t('userMenu.logOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
