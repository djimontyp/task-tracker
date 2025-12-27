import { useState, useMemo, type ReactNode } from 'react';
import { Search, Menu, HelpCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Logo } from '@/shared/components/Logo';
import { Button } from '@/shared/ui/button';
import { useTheme } from '@/shared/components/ThemeProvider';
import { useServiceStatus, useAdminMode } from '@/shared/hooks';
import { cn } from '@/shared/lib/utils';
import { NavUser } from '@/shared/components/NavUser';
import { UniversalThemeIcon, TooltipIconButton } from '@/shared/components';
import { MobileSearch } from '@/shared/components/MobileSearch';
import { useBreadcrumbs, type DynamicLabels } from './useBreadcrumbs';
import { NavBreadcrumbs } from './NavBreadcrumbs';
import { ServiceStatusIndicator } from './ServiceStatusIndicator';
import { API_ENDPOINTS } from '@/shared/config/api';

interface TopicBasic {
  id: string;
  name: string;
}

async function fetchTopicById(id: string): Promise<TopicBasic> {
  const response = await fetch(`${API_ENDPOINTS.topics}/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch topic: ${response.statusText}`);
  }
  return response.json();
}

export interface NavbarProps {
  onMobileSidebarToggle?: () => void;
  isDesktop?: boolean;
  /** Search component to render in command zone (injected to avoid circular deps) */
  searchComponent?: ReactNode;
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
const Navbar = ({ onMobileSidebarToggle, isDesktop = true, searchComponent }: NavbarProps) => {
  const { setTheme, theme } = useTheme();
  const { indicator } = useServiceStatus();
  const { isAdminMode, toggleAdminMode } = useAdminMode();
  const location = useLocation();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const queryClient = useQueryClient();

  // Extract topic ID from URL if on topic detail page
  const topicDetailMatch = location.pathname.match(/^\/topics\/([a-f0-9-]+)$/);
  const topicIdFromUrl = topicDetailMatch ? topicDetailMatch[1] : null;

  // Fetch topic data for breadcrumb label (only when on topic detail page)
  const { data: topicData } = useQuery<TopicBasic>({
    queryKey: ['topic', topicIdFromUrl],
    queryFn: () => fetchTopicById(topicIdFromUrl!),
    enabled: topicIdFromUrl !== null,
    staleTime: 5 * 60 * 1000,
    initialData: () => {
      if (topicIdFromUrl === null) return undefined;
      return queryClient.getQueryData<TopicBasic>(['topic', topicIdFromUrl]);
    },
  });

  // Prepare dynamic labels for breadcrumbs
  const dynamicLabels = useMemo<DynamicLabels | undefined>(() => {
    if (topicData?.name) {
      return { topicName: topicData.name };
    }
    return undefined;
  }, [topicData?.name]);

  const { crumbs, tooltip } = useBreadcrumbs(location.pathname, dynamicLabels);

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
        'z-modal w-full',
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
        {searchComponent && (
          <div className="hidden lg:flex items-center w-64 lg:w-80 shrink-0">
            {searchComponent}
          </div>
        )}

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

      <MobileSearch open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
        {searchComponent}
      </MobileSearch>
    </nav>
  );
};

export default Navbar;
