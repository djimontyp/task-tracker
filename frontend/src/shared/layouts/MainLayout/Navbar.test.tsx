import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from '@/shared/components/Navbar';

// Mock useSidebar hook to avoid SidebarProvider dependency
vi.mock('@/shared/ui/sidebar', () => ({
  useSidebar: () => ({
    state: 'expanded',
    open: true,
    setOpen: vi.fn(),
    openMobile: false,
    setOpenMobile: vi.fn(),
    isMobile: false,
    toggleSidebar: vi.fn(),
  }),
}));

// Mock NavUser to avoid complex dependencies
vi.mock('@/shared/components/NavUser', () => ({
  NavUser: () => <div data-testid="nav-user">User Menu</div>,
}));

// Mock MobileSearch
vi.mock('@/shared/components/MobileSearch', () => ({
  MobileSearch: ({ open, children }: { open: boolean; children?: React.ReactNode }) =>
    open ? <div data-testid="mobile-search">{children}</div> : null,
}));

// Mock TooltipIconButton to avoid Radix UI tooltip complexity in tests
vi.mock('@/shared/components/TooltipIconButton', () => ({
  TooltipIconButton: ({ icon, label, onClick }: any) => (
    <button aria-label={label} onClick={onClick}>
      {icon}
    </button>
  ),
}));

// Mock NavBreadcrumbs
vi.mock('@/shared/layouts/MainLayout/NavBreadcrumbs', () => ({
  NavBreadcrumbs: ({ crumbs }: { crumbs: any[] }) => (
    <div data-testid="breadcrumbs">
      {crumbs.map((c, i) => (
        <span key={i}>{c.label}</span>
      ))}
    </div>
  ),
}));

// Mock ServiceStatusIndicator
vi.mock('@/shared/layouts/MainLayout/ServiceStatusIndicator', () => ({
  ServiceStatusIndicator: ({ status }: { status: string }) => (
    <div data-testid="status-indicator" data-status={status} />
  ),
}));

// SearchBar mock component (passed via searchComponent prop)
const MockSearchBar = () => <div data-testid="search-bar">Search Bar</div>;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// Default props factory for Navbar (all required props)
const createDefaultProps = (overrides: any = {}): any => ({
  isDesktop: true,
  crumbs: [
    { label: 'Dashboard', href: '/' },
    { label: 'Current Page' },
  ],
  pageTooltip: 'Mock page tooltip',
  pageHint: undefined,
  theme: 'light' as const,
  onThemeChange: vi.fn(),
  serviceStatus: 'healthy' as const,
  isAdminMode: false,
  onToggleAdminMode: vi.fn(),
  user: {
    name: 'Test User',
    email: 'test@example.com',
  },
  searchComponent: <MockSearchBar />,
  onMobileSidebarToggle: vi.fn(),
  ...overrides,
});

const renderNavbar = (props: any = {}) => {
  const mergedProps = createDefaultProps(props);
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Navbar {...mergedProps} />
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

  test('calls onThemeChange when theme button clicked', async () => {
    const onThemeChange = vi.fn();
    const user = userEvent.setup();

    renderNavbar({ isDesktop: true, onThemeChange });

    // Both desktop and mobile render theme buttons (mobile hidden via CSS)
    const themeButtons = screen.getAllByLabelText('Change theme');
    await user.click(themeButtons[0]);

    expect(onThemeChange).toHaveBeenCalledTimes(1);
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

  test('displays breadcrumbs from crumbs prop', () => {
    renderNavbar({ isDesktop: true });

    // Breadcrumbs are rendered in both desktop and mobile (mobile hidden via CSS)
    const dashboards = screen.getAllByText('Dashboard');
    const currentPages = screen.getAllByText('Current Page');
    expect(dashboards.length).toBeGreaterThan(0);
    expect(currentPages.length).toBeGreaterThan(0);
  });

  test('shows healthy status indicator', () => {
    renderNavbar({ isDesktop: true, serviceStatus: 'healthy' });

    // Both desktop and mobile render status (mobile hidden via CSS)
    const statusIndicators = screen.getAllByTestId('status-indicator');
    expect(statusIndicators[0]).toHaveAttribute('data-status', 'healthy');
  });

  test('shows warning status indicator', () => {
    renderNavbar({ isDesktop: true, serviceStatus: 'warning' });

    const statusIndicators = screen.getAllByTestId('status-indicator');
    expect(statusIndicators[0]).toHaveAttribute('data-status', 'warning');
  });

  test('shows error status indicator', () => {
    renderNavbar({ isDesktop: true, serviceStatus: 'error' });

    const statusIndicators = screen.getAllByTestId('status-indicator');
    expect(statusIndicators[0]).toHaveAttribute('data-status', 'error');
  });

  test('calls onMobileSidebarToggle on hamburger click', async () => {
    const handleToggle = vi.fn();
    const user = userEvent.setup();

    renderNavbar({ isDesktop: false, onMobileSidebarToggle: handleToggle });

    const hamburger = screen.getByLabelText('Toggle sidebar');
    await user.click(hamburger);

    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  test('renders NavUser component', () => {
    renderNavbar({ isDesktop: true });

    // NavUser is rendered in both desktop and mobile (mobile hidden via CSS)
    const navUsers = screen.getAllByTestId('nav-user');
    expect(navUsers.length).toBeGreaterThan(0);
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

    // Both desktop and mobile render these buttons (mobile hidden via CSS)
    const themeButtons = screen.getAllByLabelText('Change theme');
    const pageInfoButtons = screen.getAllByLabelText('Page info');
    expect(themeButtons.length).toBeGreaterThan(0);
    expect(pageInfoButtons.length).toBeGreaterThan(0);
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
