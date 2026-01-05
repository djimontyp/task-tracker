import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SidebarProvider } from '@/shared/ui/sidebar';
import { ThemeProvider } from '@/shared/components/ThemeProvider';
import { Navbar, type NavbarProps } from '@/shared/components/Navbar';

/**
 * Navbar component stories (Layout context).
 *
 * NOTE: The Navbar component is defined in @/shared/components/Navbar.
 * This file provides stories in the Layout context for MainLayout integration.
 * See also: Components/Navbar stories for the portable component.
 *
 * The Navbar uses a 3-zone architecture:
 * - **CONTEXT** (left): Help button + Breadcrumbs - "Where am I?"
 * - **COMMAND** (center): Search bar - "What can I do?"
 * - **ACTIONS** (right): Status dot, Theme toggle, User menu
 *
 * Design features:
 * - **Borderless design**: Uses shadow-sm instead of bottom border
 * - **Dark mode shadow**: Custom shadow for dark mode visibility
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

/**
 * Default props for Navbar stories.
 * Since Navbar is now a pure presenter, all data must be passed via props.
 */
const defaultNavbarProps: Omit<NavbarProps, 'isDesktop' | 'onMobileSidebarToggle' | 'searchComponent'> = {
  crumbs: [
    { label: 'Dashboard' },
  ],
  pageTooltip: 'Dashboard - Your workspace overview',
  theme: 'system',
  onThemeChange: () => console.log('Theme changed'),
  isAdminMode: false,
  onToggleAdminMode: () => console.log('Admin mode toggled'),
  user: {
    name: 'User',
    email: 'user@example.com',
  },
};

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

Main navigation header using **3-zone architecture** with **borderless design**.

> See also: **Components/Navbar** for the portable component stories.

### Desktop Layout
\`[CONTEXT: ? + Breadcrumbs] [COMMAND: Search] [ACTIONS: + Theme + User]\`

### Mobile Layout
- Row 1: Hamburger ... Search + Status + Theme + User
- Row 2: Help + Breadcrumbs (full width)

### Zone Breakdown
| Zone | Purpose | Elements |
|------|---------|----------|
| **CONTEXT** | Where am I? | Help button + Breadcrumbs |
| **COMMAND** | What can I do? | Search bar (w-80) |
| **ACTIONS** | Quick access | Status dot, Theme, User menu |

### User Menu Contains
- Account link
- Settings link
- Admin Mode toggle
- Logout

### Design System Compliance
- **Borderless**: Uses \`shadow-sm\` instead of \`border-b\`
- **Dark mode**: Custom shadow \`dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)]\`
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
    ...defaultNavbarProps,
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
    ...defaultNavbarProps,
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
 * Navbar with admin mode toggle in user menu.
 */
export const WithAdminMode: Story = {
  args: {
    ...defaultNavbarProps,
    isDesktop: true,
    isAdminMode: true,
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
    ...defaultNavbarProps,
    isDesktop: true,
    crumbs: [
      { label: 'Automation', href: '/automation' },
      { label: 'Rules', href: '/automation/rules' },
      { label: 'Edit Rule' },
    ],
    pageTooltip: 'Automation Rules - Edit existing rule configuration',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Navbar with multiple breadcrumb levels showing truncation behavior.',
      },
    },
  },
};

/**
 * Navbar with page hint showing contextual information.
 */
export const WithPageHint: Story = {
  args: {
    ...defaultNavbarProps,
    isDesktop: true,
    pageHint: '12 new messages',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Page hint displays contextual info after breadcrumbs (e.g., "12 new messages", "3 pending tasks").',
      },
    },
  },
};

/**
 * Navbar with breadcrumbs and page hint.
 */
export const WithBreadcrumbsAndHint: Story = {
  args: {
    ...defaultNavbarProps,
    isDesktop: true,
    crumbs: [
      { label: 'Topics', href: '/topics' },
      { label: 'Mobile' },
    ],
    pageTooltip: 'Mobile topic - View atoms and related messages',
    pageHint: '3 atoms pending review',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Combined view showing breadcrumbs with a page hint for additional context.',
      },
    },
  },
};
