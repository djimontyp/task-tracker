import type { ReactNode, RefObject } from 'react';
import type { BreadcrumbSegment } from '@/shared/layouts/MainLayout/useBreadcrumbs';

/**
 * Theme options
 */
export type ThemeOption = 'light' | 'dark' | 'system';

/**
 * User data for NavUser component
 */
export interface NavbarUser {
  name: string;
  email: string;
  avatar?: string;
}

/**
 * Navbar props - all data passed from container.
 * This component is a pure presenter with no data fetching.
 */
export interface NavbarProps {
  // Layout
  isDesktop?: boolean;
  onMobileSidebarToggle?: () => void;

  // Breadcrumbs (computed by container)
  crumbs: BreadcrumbSegment[];
  pageTooltip: string;

  // Page hint - contextual info displayed after breadcrumbs
  // e.g., "12 new messages" or "3 pending tasks"
  pageHint?: string;

  // Theme
  theme: ThemeOption;
  onThemeChange: () => void;

  // Admin mode
  isAdminMode: boolean;
  onToggleAdminMode: () => void;

  // User
  user: NavbarUser;

  // Search component (injected to avoid circular deps)
  searchComponent?: ReactNode;

  // Scroll container ref for glassmorphism effect on desktop
  scrollContainerRef?: RefObject<HTMLElement>;
}
