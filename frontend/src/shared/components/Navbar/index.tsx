import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Menu, HelpCircle, PanelLeft } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import { useSidebar } from '@/shared/ui/sidebar';
import { NavUser } from '@/shared/components/NavUser';
import { UniversalThemeIcon, TooltipIconButton } from '@/shared/components';
import { MobileSearch } from '@/shared/components/MobileSearch';
import { NavBreadcrumbs } from '@/shared/layouts/MainLayout/NavBreadcrumbs';
import { useScrolled } from '@/shared/hooks';
import type { NavbarProps } from './types';

/**
 * Navbar - Pure presenter component for main navigation header.
 *
 * This component receives all data via props and performs no data fetching.
 * Container (MainLayout) is responsible for providing data.
 *
 * Desktop Layout:
 * [CONTEXT: Breadcrumbs] [COMMAND: Search] [ACTIONS: Status, Theme, User]
 *
 * Mobile Layout:
 * Row 1: [Logo][☰] ... [🔍][●][🌙][👤]
 * Row 2: [Breadcrumbs]
 */
export function Navbar({
  isDesktop = true,
  onMobileSidebarToggle,
  crumbs,
  pageTooltip,
  pageHint,
  theme,
  onThemeChange,
  isAdminMode,
  onToggleAdminMode,
  user,
  searchComponent,
  scrollContainerRef,
}: NavbarProps) {
  const { t } = useTranslation();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { toggleSidebar } = useSidebar();
  const isScrolled = useScrolled({ threshold: 10, elementRef: scrollContainerRef });

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return t('navbar.theme.light');
      case 'dark':
        return t('navbar.theme.dark');
      case 'system':
        return t('navbar.theme.system');
      default:
        return t('navbar.theme.change');
    }
  };

  return (
    <nav
      className={cn(
        'z-fixed w-full transition-all duration-200',
        // Desktop: glassmorphism on scroll
        isDesktop && (isScrolled
          ? 'bg-background/60 backdrop-blur-md border-b border-border/40 shadow-sm'
          : 'bg-background border-b border-border'),
        // Mobile: always glassmorphism (fixed navbar)
        !isDesktop && 'fixed top-0 left-0 right-0 bg-background/60 backdrop-blur-md border-b border-border/40 shadow-sm'
      )}
    >
      {/* Desktop: Single row with 3 zones */}
      <div className="hidden md:flex items-center h-14 px-4 lg:px-6 gap-4">
        {/* CONTEXT ZONE: Toggle + Help + Breadcrumbs + Hint (left, auto width) */}
        <div className="shrink-0 min-w-0 flex items-center gap-2">
          <TooltipIconButton
            icon={<PanelLeft className="h-4 w-4" />}
            label={t('navbar.toggleSidebar')}
            tooltip={t('navbar.toggleSidebar')}
            onClick={toggleSidebar}
          />
          <TooltipIconButton
            icon={<HelpCircle className="h-4 w-4" />}
            label={t('navbar.pageInfo')}
            tooltip={pageTooltip}
          />
          <NavBreadcrumbs crumbs={crumbs} variant="desktop" />
          {pageHint && (
            <span className="text-xs text-muted-foreground">
              <span className="mx-2" aria-hidden="true">·</span>
              {pageHint}
            </span>
          )}
        </div>

        {/* COMMAND ZONE: Search (fills available space between context and actions) */}
        {searchComponent && (
          <div className="hidden lg:flex flex-1 min-w-0 items-center justify-center mx-4">
            <div className="w-full max-w-3xl">
              {searchComponent}
            </div>
          </div>
        )}

        {/* ACTIONS ZONE: Theme + User (right, pushed to end) */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <TooltipIconButton
            icon={<UniversalThemeIcon theme={theme} className="h-5 w-5" />}
            label={t('navbar.theme.change')}
            tooltip={getThemeLabel()}
            onClick={onThemeChange}
          />

          <NavUser
            user={user}
            isAdminMode={isAdminMode}
            onToggleAdminMode={onToggleAdminMode}
          />
        </div>
      </div>

      {/* Mobile: Two rows */}
      <div className="md:hidden">
        {/* Row 1: Logo + Menu ... Actions */}
        <div className="flex items-center justify-between h-14 px-2 sm:px-4">
          {/* Left: Hamburger only (Logo is in sidebar) */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMobileSidebarToggle}
              className="h-11 w-11 shrink-0 rounded-lg text-muted-foreground transition-all duration-200 ease-out hover:bg-muted hover:text-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t('navbar.toggleSidebar')}
            >
              <Menu className="size-5 transition-transform duration-200" />
            </Button>
          </div>

          {/* Right: Search + Theme + User */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 rounded-lg text-muted-foreground transition-all duration-200 ease-out hover:bg-muted hover:text-foreground active:scale-95 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setMobileSearchOpen(true)}
              aria-label={t('navbar.openSearch')}
            >
              <Search className="h-5 w-5" />
            </Button>

            <TooltipIconButton
              icon={<UniversalThemeIcon theme={theme} className="h-5 w-5" />}
              label={t('navbar.theme.change')}
              tooltip={getThemeLabel()}
              onClick={onThemeChange}
            />

            <NavUser
              user={user}
              isAdminMode={isAdminMode}
              onToggleAdminMode={onToggleAdminMode}
            />
          </div>
        </div>

        {/* Row 2: Help + Breadcrumbs + Hint (full width) */}
        <div className="px-2 sm:px-4 pb-2 border-t border-border flex items-center gap-2">
          <TooltipIconButton
            icon={<HelpCircle className="h-4 w-4" />}
            label={t('navbar.pageInfo')}
            tooltip={pageTooltip}
          />
          <NavBreadcrumbs crumbs={crumbs} variant="mobile" />
          {/* Hint hidden on mobile, shown on sm+ screens */}
          {pageHint && (
            <span className="hidden sm:inline text-xs text-muted-foreground">
              <span className="mx-2" aria-hidden="true">·</span>
              {pageHint}
            </span>
          )}
        </div>
      </div>

      <MobileSearch open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
        {searchComponent}
      </MobileSearch>
    </nav>
  );
}

export type { NavbarProps, NavbarUser, ThemeOption } from './types';
