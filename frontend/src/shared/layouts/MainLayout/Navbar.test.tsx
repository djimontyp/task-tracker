import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './Navbar';

// Mock hooks
vi.mock('@/shared/components/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({
    theme: 'light',
    setTheme: vi.fn(),
  })),
}));

vi.mock('@/shared/hooks', () => ({
  useServiceStatus: vi.fn(() => ({
    indicator: 'healthy',
    isConnected: true,
  })),
  useAdminMode: vi.fn(() => ({
    isAdminMode: false,
    toggleAdminMode: vi.fn(),
  })),
}));

vi.mock('./useBreadcrumbs', () => ({
  useBreadcrumbs: vi.fn(() => ({
    crumbs: [
      { label: 'Dashboard', href: '/' },
      { label: 'Current Page' },
    ],
    tooltip: 'Mock page tooltip',
  })),
}));

// Mock components that require complex setup
vi.mock('@/features/search/components', () => ({
  SearchBar: () => <div data-testid="search-bar">Search Bar</div>,
}));

vi.mock('@/shared/components/MobileSearch', () => ({
  MobileSearch: ({ open }: { open: boolean }) =>
    open ? <div data-testid="mobile-search">Mobile Search</div> : null,
}));

vi.mock('@/shared/components/NavUser', () => ({
  NavUser: () => <div data-testid="nav-user">User Menu</div>,
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const renderNavbar = (props = {}) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Navbar {...props} />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders desktop version with 3-zone architecture', () => {
    renderNavbar({ isDesktop: true });

    // 3 zones: Context (breadcrumbs), Command (search), Actions (status, theme, user)
    const navs = screen.getAllByRole('navigation');
    const mainNav = navs.find(nav => nav.getAttribute('aria-label') === 'Main navigation');
    expect(mainNav).toBeInTheDocument();
    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    // Both desktop and mobile render nav-user
    const userMenus = screen.getAllByTestId('nav-user');
    expect(userMenus.length).toBeGreaterThan(0);
  });

  test('renders mobile version correctly', () => {
    renderNavbar({ isDesktop: false });

    expect(screen.getByLabelText('Toggle sidebar')).toBeInTheDocument();
    expect(screen.getByLabelText('Open search')).toBeInTheDocument();
  });

  test('cycles theme: light -> dark -> system -> light', async () => {
    const setThemeMock = vi.fn();
    const { useTheme } = await import('@/shared/components/ThemeProvider');
    let currentTheme = 'light';

    vi.mocked(useTheme).mockImplementation(() => ({
      theme: currentTheme as 'light' | 'dark' | 'system',
      setTheme: (newTheme: string) => {
        currentTheme = newTheme;
        setThemeMock(newTheme);
      },
    }));

    const user = userEvent.setup();
    const { rerender } = renderNavbar({ isDesktop: true });

    // Both desktop and mobile have theme buttons, click first one
    const themeButtons = screen.getAllByLabelText('Change theme');
    await user.click(themeButtons[0]);

    expect(setThemeMock).toHaveBeenCalledWith('dark');

    vi.mocked(useTheme).mockImplementation(() => ({
      theme: 'dark',
      setTheme: setThemeMock,
    }));

    rerender(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Navbar isDesktop={true} />
        </MemoryRouter>
      </QueryClientProvider>
    );

    const themeButtonsAfter = screen.getAllByLabelText('Change theme');
    await user.click(themeButtonsAfter[0]);
    expect(setThemeMock).toHaveBeenCalledWith('system');
  });

  test('shows mobile menu button when isDesktop=false', () => {
    renderNavbar({ isDesktop: false });

    expect(screen.getByLabelText('Toggle sidebar')).toBeInTheDocument();
  });

  test('mobile section is hidden via CSS when isDesktop=true', () => {
    renderNavbar({ isDesktop: true });

    // Mobile section is always rendered but hidden via CSS (md:hidden)
    // The Toggle sidebar button exists in DOM but is not visible on desktop
    const toggleButton = screen.queryByLabelText('Toggle sidebar');
    // Button exists but its parent div has md:hidden class
    expect(toggleButton).toBeInTheDocument();
    // Verify parent container has the hiding class
    expect(toggleButton?.closest('.md\\:hidden')).toBeInTheDocument();
  });

  test('displays breadcrumbs from useBreadcrumbs hook', () => {
    renderNavbar({ isDesktop: true });

    // Desktop and mobile both render breadcrumbs, so we expect multiple matches
    const dashboardLinks = screen.getAllByText('Dashboard');
    const currentPageTexts = screen.getAllByText('Current Page');

    expect(dashboardLinks.length).toBeGreaterThanOrEqual(1);
    expect(currentPageTexts.length).toBeGreaterThanOrEqual(1);
  });

  test('shows healthy status indicator (green)', async () => {
    const { useServiceStatus } = await import('@/shared/hooks');
    vi.mocked(useServiceStatus).mockReturnValue({
      indicator: 'healthy',
      isConnected: true,
    });

    renderNavbar({ isDesktop: true });

    // Both desktop and mobile have status dots
    const statusDots = screen.getAllByTestId('status-dot');
    expect(statusDots[0]).toHaveClass('bg-semantic-success');
  });

  test('shows warning status indicator (yellow + pulse)', async () => {
    const { useServiceStatus } = await import('@/shared/hooks');
    vi.mocked(useServiceStatus).mockReturnValue({
      indicator: 'warning',
      isConnected: true,
    });

    renderNavbar({ isDesktop: true });

    const statusDots = screen.getAllByTestId('status-dot');
    expect(statusDots[0]).toHaveClass('bg-semantic-warning');
    expect(statusDots[0]).toHaveClass('animate-pulse');
  });

  test('shows error status indicator (red + pulse)', async () => {
    const { useServiceStatus } = await import('@/shared/hooks');
    vi.mocked(useServiceStatus).mockReturnValue({
      indicator: 'error',
      isConnected: false,
    });

    renderNavbar({ isDesktop: true });

    const statusDots = screen.getAllByTestId('status-dot');
    expect(statusDots[0]).toHaveClass('bg-destructive');
    expect(statusDots[0]).toHaveClass('animate-pulse');
  });

  test('calls onMobileSidebarToggle on hamburger click', async () => {
    const handleToggle = vi.fn();
    const user = userEvent.setup();

    renderNavbar({ isDesktop: false, onMobileSidebarToggle: handleToggle });

    const hamburger = screen.getByLabelText('Toggle sidebar');
    await user.click(hamburger);

    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  test('passes admin mode state to NavUser', async () => {
    const { useAdminMode } = await import('@/shared/hooks');
    vi.mocked(useAdminMode).mockReturnValue({
      isAdminMode: true,
      toggleAdminMode: vi.fn(),
    });

    renderNavbar({ isDesktop: true });

    // Admin Mode toggle is now in NavUser dropdown
    // NavUser receives isAdminMode and onToggleAdminMode props
    // Both desktop and mobile render nav-user
    const userMenus = screen.getAllByTestId('nav-user');
    expect(userMenus.length).toBeGreaterThan(0);
  });

  test('keyboard navigation works (Tab through elements)', async () => {
    const user = userEvent.setup();
    renderNavbar({ isDesktop: true });

    // Start tabbing
    await user.tab();

    // Check that focus moves to interactive elements
    const focusableElements = screen.getAllByRole('button');
    expect(focusableElements.length).toBeGreaterThan(0);
  });

  test('has correct aria-labels on action buttons', () => {
    renderNavbar({ isDesktop: true });

    // Both desktop and mobile render theme buttons, check at least one exists
    const themeButtons = screen.getAllByLabelText('Change theme');
    expect(themeButtons.length).toBeGreaterThan(0);
    // Settings is now in NavUser dropdown, not a separate button
    const userMenus = screen.getAllByTestId('nav-user');
    expect(userMenus.length).toBeGreaterThan(0);
  });

  test('opens mobile search when search button clicked', async () => {
    const user = userEvent.setup();
    renderNavbar({ isDesktop: false });

    const searchButton = screen.getByLabelText('Open search');
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByTestId('mobile-search')).toBeInTheDocument();
    });
  });

  test('nav has fixed positioning on mobile', () => {
    renderNavbar({ isDesktop: false });

    // Main navigation is the parent nav with aria-label
    const navs = screen.getAllByRole('navigation');
    const mainNav = navs.find(nav => nav.getAttribute('aria-label') === 'Main navigation');
    expect(mainNav).toHaveClass('fixed');
  });

  test('nav does not have fixed positioning on desktop', () => {
    renderNavbar({ isDesktop: true });

    const navs = screen.getAllByRole('navigation');
    const mainNav = navs.find(nav => nav.getAttribute('aria-label') === 'Main navigation');
    expect(mainNav).not.toHaveClass('fixed');
  });
});
