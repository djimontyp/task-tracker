import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SidebarProvider } from '@/shared/ui/sidebar';
import { ThemeProvider } from '@/shared/components/ThemeProvider';
import Navbar from './Navbar';

/**
 * Navbar component stories.
 *
 * The Navbar uses a 3-zone architecture:
 * - **CONTEXT** (left): Breadcrumbs - "Where am I?"
 * - **COMMAND** (center): Search bar - "What can I do?"
 * - **ACTIONS** (right): Status dot, Theme toggle, User menu
 *
 * Settings and Admin Mode are accessible via User dropdown.
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

Main navigation header using **3-zone architecture**.

### Desktop Layout
\`[CONTEXT: Breadcrumbs] [COMMAND: Search] [ACTIONS: ●🌙👤]\`

### Mobile Layout
- Row 1: Logo + Hamburger ... Search + Status + Theme + User
- Row 2: Breadcrumbs (full width)

### Zone Breakdown
| Zone | Purpose | Elements |
|------|---------|----------|
| **CONTEXT** | Where am I? | Breadcrumbs (flex-1) |
| **COMMAND** | What can I do? | Search bar (w-80) |
| **ACTIONS** | Quick access | Status dot, Theme, User menu |

### User Menu Contains
- Account link
- Settings link
- Admin Mode toggle
- Logout

### Design System Compliance
- Uses semantic color tokens
- 44px touch targets (WCAG 2.5.5)
- All buttons have aria-labels
- \`<nav aria-label="Main navigation">\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Navbar>;

/**
 * Default desktop view with 3-zone layout.
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
          'Desktop view with 3 zones: Context (breadcrumbs), Command (search), Actions (status + theme + user).',
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
 * Navbar with admin mode toggle in user menu.
 */
export const WithAdminMode: Story = {
  args: {
    isDesktop: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Admin Mode toggle is in the User dropdown menu. Click the user avatar to see the toggle.',
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
