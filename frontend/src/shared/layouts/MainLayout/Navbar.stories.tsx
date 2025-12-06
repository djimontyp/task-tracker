import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SidebarProvider } from '@/shared/ui/sidebar';
import { ThemeProvider } from '@/shared/components/ThemeProvider';
import Navbar from './Navbar';

/**
 * Navbar component stories.
 *
 * The Navbar provides:
 * - Logo (mobile only)
 * - Mobile menu toggle
 * - Breadcrumb navigation
 * - Search bar (desktop) / Search button (mobile)
 * - Service status indicator
 * - Theme toggle
 * - Settings link
 * - User menu
 */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const NavbarDecorator = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <MemoryRouter initialEntries={['/dashboard']}>
        <SidebarProvider defaultOpen={true}>{children}</SidebarProvider>
      </MemoryRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

const meta: Meta<typeof Navbar> = {
  title: 'Layout/Navbar',
  component: Navbar,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <NavbarDecorator>
        <div className="bg-background min-h-[200px]">
          <Story />
        </div>
      </NavbarDecorator>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## Navbar Component

Main navigation header for the application.

### Features
- **Logo**: Shown only on mobile (desktop shows logo in sidebar)
- **Breadcrumbs**: Responsive - mobile variant is more compact
- **Service Status**: Dot indicator with tooltip
- **Theme Toggle**: Cycles through light/dark/system
- **Settings**: Link to settings page

### Design System Compliance
- Uses semantic color tokens
- 44px touch targets (WCAG 2.5.5)
- All buttons have aria-labels
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Navbar>;

/**
 * Default desktop view with all features visible.
 */
export const Default: Story = {
  args: {
    isDesktop: true,
  },
  parameters: {
    viewport: { defaultViewport: 'lg' },
    docs: {
      description: {
        story:
          'Default desktop view. Shows breadcrumbs, search bar, status indicator, theme toggle, and settings.',
      },
    },
  },
};

/**
 * Mobile view with hamburger menu and mobile-specific layout.
 */
export const Mobile: Story = {
  args: {
    isDesktop: false,
    onMobileSidebarToggle: () => console.log('Toggle sidebar'),
  },
  parameters: {
    viewport: { defaultViewport: 'xs' },
    docs: {
      description: {
        story:
          'Mobile view with hamburger menu, logo, and mobile-optimized breadcrumbs.',
      },
    },
  },
};

/**
 * Navbar with healthy service status (green indicator).
 */
export const StatusHealthy: Story = {
  args: {
    isDesktop: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Service status indicator showing healthy state (green dot, no pulse).',
      },
    },
  },
};

/**
 * Navbar with warning service status (yellow pulsing indicator).
 */
export const StatusWarning: Story = {
  args: {
    isDesktop: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Service status indicator showing warning state (yellow dot with pulse animation).',
      },
    },
  },
  // Note: To actually show warning status, you would need to mock useServiceStatus
};

/**
 * Navbar with error service status (red pulsing indicator).
 */
export const StatusError: Story = {
  args: {
    isDesktop: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Service status indicator showing error state (red dot with pulse animation).',
      },
    },
  },
  // Note: To actually show error status, you would need to mock useServiceStatus
};

/**
 * Navbar with admin mode enabled.
 */
export const WithAdminMode: Story = {
  args: {
    isDesktop: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Navbar showing admin badge when admin mode is active. Use localStorage to enable admin mode.',
      },
    },
  },
};

/**
 * Navbar with long breadcrumb trail.
 */
export const WithLongBreadcrumbs: Story = {
  args: {
    isDesktop: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Navbar with multiple breadcrumb levels showing truncation behavior.',
      },
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <MemoryRouter initialEntries={['/automation/rules/edit/123']}>
            <SidebarProvider defaultOpen={true}>
              <div className="bg-background min-h-[200px]">
                <Story />
              </div>
            </SidebarProvider>
          </MemoryRouter>
        </ThemeProvider>
      </QueryClientProvider>
    ),
  ],
};
