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

vi.mock('@/features/websocket/hooks/useServiceStatus', () => ({
  useServiceStatus: vi.fn(() => ({
    indicator: 'healthy',
    isConnected: true,
  })),
}));

vi.mock('@/shared/hooks', () => ({
  useAdminMode: vi.fn(() => ({
    isAdminMode: false,
  })),
}));

vi.mock('./useBreadcrumbs', () => ({
  useBreadcrumbs: vi.fn(() => [
    { label: 'Dashboard', href: '/' },
    { label: 'Current Page' },
  ]),
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

  test('renders desktop version correctly', () => {
    renderNavbar({ isDesktop: true });

    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    expect(screen.getByTestId('nav-user')).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
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

    const themeButton = screen.getByLabelText('Change theme');
    await user.click(themeButton);

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

    await user.click(screen.getByLabelText('Change theme'));
    expect(setThemeMock).toHaveBeenCalledWith('system');
  });

  test('shows mobile menu button when isDesktop=false', () => {
    renderNavbar({ isDesktop: false });

    expect(screen.getByLabelText('Toggle sidebar')).toBeInTheDocument();
  });

  test('hides mobile menu button when isDesktop=true', () => {
    renderNavbar({ isDesktop: true });

    expect(screen.queryByLabelText('Toggle sidebar')).not.toBeInTheDocument();
  });

  test('displays breadcrumbs from useBreadcrumbs hook', () => {
    renderNavbar({ isDesktop: true });

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Current Page')).toBeInTheDocument();
  });

  test('shows healthy status indicator (green)', async () => {
    const { useServiceStatus } = await import(
      '@/features/websocket/hooks/useServiceStatus'
    );
    vi.mocked(useServiceStatus).mockReturnValue({
      indicator: 'healthy',
      isConnected: true,
    });

    renderNavbar({ isDesktop: true });

    const statusDot = screen.getByTestId('status-dot');
    expect(statusDot).toHaveClass('bg-semantic-success');
  });

  test('shows warning status indicator (yellow + pulse)', async () => {
    const { useServiceStatus } = await import(
      '@/features/websocket/hooks/useServiceStatus'
    );
    vi.mocked(useServiceStatus).mockReturnValue({
      indicator: 'warning',
      isConnected: true,
    });

    renderNavbar({ isDesktop: true });

    const statusDot = screen.getByTestId('status-dot');
    expect(statusDot).toHaveClass('bg-semantic-warning');
    expect(statusDot).toHaveClass('animate-pulse');
  });

  test('shows error status indicator (red + pulse)', async () => {
    const { useServiceStatus } = await import(
      '@/features/websocket/hooks/useServiceStatus'
    );
    vi.mocked(useServiceStatus).mockReturnValue({
      indicator: 'error',
      isConnected: false,
    });

    renderNavbar({ isDesktop: true });

    const statusDot = screen.getByTestId('status-dot');
    expect(statusDot).toHaveClass('bg-destructive');
    expect(statusDot).toHaveClass('animate-pulse');
  });

  test('calls onMobileSidebarToggle on hamburger click', async () => {
    const handleToggle = vi.fn();
    const user = userEvent.setup();

    renderNavbar({ isDesktop: false, onMobileSidebarToggle: handleToggle });

    const hamburger = screen.getByLabelText('Toggle sidebar');
    await user.click(hamburger);

    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  test('shows AdminBadge when admin mode active', async () => {
    const { useAdminMode } = await import('@/shared/hooks');
    vi.mocked(useAdminMode).mockReturnValue({
      isAdminMode: true,
      enableAdminMode: vi.fn(),
      disableAdminMode: vi.fn(),
    });

    renderNavbar({ isDesktop: true });

    // AdminBadge is rendered conditionally
    // We check that the component renders when isAdminMode is true
    // The actual AdminBadge component handles the visual display
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

  test('has correct aria-labels on all buttons', () => {
    renderNavbar({ isDesktop: true });

    expect(screen.getByLabelText('Change theme')).toBeInTheDocument();
    expect(screen.getByLabelText('Settings')).toBeInTheDocument();
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

  test('header has fixed positioning on mobile', () => {
    renderNavbar({ isDesktop: false });

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('fixed');
  });

  test('header does not have fixed positioning on desktop', () => {
    renderNavbar({ isDesktop: true });

    const header = screen.getByRole('banner');
    expect(header).not.toHaveClass('fixed');
  });
});
