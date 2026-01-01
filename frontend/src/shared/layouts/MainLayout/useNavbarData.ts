import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/shared/components/ThemeProvider';
import { useServiceStatus, useAdminMode } from '@/shared/hooks';
import { useBreadcrumbs, type DynamicLabels } from './useBreadcrumbs';
import type { NavbarProps, ThemeOption } from '@/shared/components/Navbar';

/**
 * Topic data structure for breadcrumb resolution.
 * Minimal interface to avoid coupling with feature types.
 */
interface TopicData {
  name: string;
}

/**
 * Configuration for useNavbarData hook.
 * Allows dependency injection to maintain architectural boundaries.
 */
export interface UseNavbarDataConfig {
  /**
   * Function to fetch topic by ID.
   * Injected from MainLayout to avoid shared -> features import.
   */
  fetchTopicById: (id: string) => Promise<TopicData>;
}

/**
 * Hook that provides all data needed for Navbar component.
 * Handles data fetching, theme state, and breadcrumb computation.
 *
 * This separates container logic from the Navbar presenter,
 * making Navbar portable and testable.
 *
 * @param config - Configuration with injected dependencies
 */
export function useNavbarData(
  config: UseNavbarDataConfig
): Omit<NavbarProps, 'isDesktop' | 'onMobileSidebarToggle' | 'searchComponent'> {
  const { fetchTopicById } = config;
  const { setTheme, theme } = useTheme();
  const { indicator } = useServiceStatus();
  const { isAdminMode, toggleAdminMode } = useAdminMode();
  const location = useLocation();

  // Extract topic ID from URL if on topic detail page
  const topicDetailMatch = location.pathname.match(/^\/topics\/([a-f0-9-]+)$/);
  const topicIdFromUrl = topicDetailMatch ? topicDetailMatch[1] : null;

  // Fetch topic data for breadcrumb label (only when on topic detail page)
  const { data: topicData } = useQuery({
    queryKey: ['topic', topicIdFromUrl],
    queryFn: () => fetchTopicById(topicIdFromUrl!),
    enabled: topicIdFromUrl !== null,
    staleTime: 5 * 60 * 1000,
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
    const themeOrder: ThemeOption[] = ['light', 'dark', 'system'];
    const currentIndex = themeOrder.indexOf(theme as ThemeOption);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex]);
  };

  return {
    crumbs,
    pageTooltip: tooltip,
    theme: theme as ThemeOption,
    onThemeChange: cycleTheme,
    serviceStatus: indicator,
    isAdminMode,
    onToggleAdminMode: toggleAdminMode,
    user: {
      name: 'User',
      email: 'user@example.com',
    },
  };
}
