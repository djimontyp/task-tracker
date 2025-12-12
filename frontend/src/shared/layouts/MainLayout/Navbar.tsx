import { useState } from 'react';
import { Search, Menu, HelpCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Logo } from '@/shared/components/Logo';
import { Button } from '@/shared/ui/button';
import { useTheme } from '@/shared/components/ThemeProvider';
import { useServiceStatus } from '@/features/websocket/hooks/useServiceStatus';
import { cn } from '@/shared/lib/utils';
import { NavUser } from '@/shared/components/NavUser';
import { UniversalThemeIcon, TooltipIconButton } from '@/shared/components';
import { SearchBar } from '@/features/search/components';
import { MobileSearch } from '@/shared/components/MobileSearch';
import { useBreadcrumbs } from './useBreadcrumbs';
import { useAdminMode } from '@/shared/hooks';
import { NavBreadcrumbs } from './NavBreadcrumbs';
import { ServiceStatusIndicator } from './ServiceStatusIndicator';

export interface NavbarProps {
  onMobileSidebarToggle?: () => void;
  isDesktop?: boolean;
}

/**
 * Navbar - Main navigation header with 3-zone architecture.
 *
 * Desktop Layout:
 * [CONTEXT: Breadcrumbs] [COMMAND: Search] [ACTIONS: Status●, Theme, User]
 *
 * Mobile Layout:
 * Row 1: [Logo][☰] ... [🔍][●][🌙][👤]
 * Row 2: [Breadcrumbs]
 *
 * Settings and Admin Mode are accessible via NavUser dropdown.
 */
const Navbar = ({ onMobileSidebarToggle, isDesktop = true }: NavbarProps) => {
  const { setTheme, theme } = useTheme();
  const { indicator } = useServiceStatus();
  const { isAdminMode, toggleAdminMode } = useAdminMode();
  const location = useLocation();
  const { crumbs, tooltip } = useBreadcrumbs(location.pathname);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const cycleTheme = () => {
    const themeOrder: Array<'light' | 'dark' | 'system'> = [
      'light',
      'dark',
      'system',
    ];
    const currentIndex = themeOrder.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex]);
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light theme';
      case 'dark':
        return 'Dark theme';
      case 'system':
        return 'System theme';
      default:
        return 'Change theme';
    }
  };

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        'z-50 w-full',
        'bg-card border-b border-border',
        !isDesktop && 'fixed top-0 left-0 right-0'
      )}
    >
      {/* Desktop: Single row with 3 zones */}
      <div className="hidden md:flex items-center h-14 px-4 lg:px-6 gap-4">
        {/* CONTEXT ZONE: Help + Breadcrumbs (left, flex-1) */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <TooltipIconButton
            icon={<HelpCircle className="h-4 w-4" />}
            label="Page info"
            tooltip={tooltip}
          />
          <NavBreadcrumbs crumbs={crumbs} variant="desktop" />
        </div>

        {/* COMMAND ZONE: Search (center, max-w-80) */}
        <div className="hidden lg:flex items-center w-64 lg:w-80 shrink-0">
          <SearchBar />
        </div>

        {/* ACTIONS ZONE: Status + Theme + User (right, gap-2) */}
        <div className="flex items-center gap-2 shrink-0">
          <ServiceStatusIndicator status={indicator} className="hidden sm:flex" />

          <TooltipIconButton
            icon={<UniversalThemeIcon theme={theme} className="h-5 w-5" />}
            label="Change theme"
            tooltip={getThemeLabel()}
            onClick={cycleTheme}
          />

          <NavUser
            user={{
              name: 'User',
              email: 'user@example.com',
            }}
            isAdminMode={isAdminMode}
            onToggleAdminMode={toggleAdminMode}
          />
        </div>
      </div>

      {/* Mobile: Two rows */}
      <div className="md:hidden">
        {/* Row 1: Logo + Menu ... Actions */}
        <div className="flex items-center justify-between h-14 px-2 sm:px-4">
          {/* Left: Logo + Hamburger */}
          <div className="flex items-center gap-2">
            <Logo size="sm" showText className="-ml-2 sm:-ml-4" />

            <Button
              variant="ghost"
              size="icon"
              onClick={onMobileSidebarToggle}
              className="h-11 w-11 shrink-0 rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Toggle sidebar"
            >
              <Menu className="size-5" />
            </Button>
          </div>

          {/* Right: Search + Status + Theme + User */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setMobileSearchOpen(true)}
              aria-label="Open search"
            >
              <Search className="h-5 w-5" />
            </Button>

            <ServiceStatusIndicator status={indicator} className="hidden xs:flex" />

            <TooltipIconButton
              icon={<UniversalThemeIcon theme={theme} className="h-5 w-5" />}
              label="Change theme"
              tooltip={getThemeLabel()}
              onClick={cycleTheme}
            />

            <NavUser
              user={{
                name: 'User',
                email: 'user@example.com',
              }}
              isAdminMode={isAdminMode}
              onToggleAdminMode={toggleAdminMode}
            />
          </div>
        </div>

        {/* Row 2: Help + Breadcrumbs (full width) */}
        <div className="px-2 sm:px-4 pb-2 border-t border-border flex items-center gap-2">
          <TooltipIconButton
            icon={<HelpCircle className="h-4 w-4" />}
            label="Page info"
            tooltip={tooltip}
          />
          <NavBreadcrumbs crumbs={crumbs} variant="mobile" />
        </div>
      </div>

      <MobileSearch open={mobileSearchOpen} onOpenChange={setMobileSearchOpen} />
    </nav>
  );
};

export default Navbar;
