import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SidebarProvider } from '@/shared/ui/sidebar';
import { ThemeProvider } from '@/shared/components/ThemeProvider';
import { Navbar, type NavbarProps } from './index';

/**
 * Navbar - Portable presenter component for main navigation header.
 *
 * The Navbar uses a 3-zone architecture:
 * - **CONTEXT** (left): Help button + Breadcrumbs - "Where am I?"
 * - **COMMAND** (center): Search bar - "What can I do?"
 * - **ACTIONS** (right): Status dot, Theme toggle, User menu
 *
 * ## Design Features
 * - **Borderless design**: Uses shadow-sm instead of bottom border
 * - **Dark mode shadow**: Custom shadow for dark mode visibility
 * - **44px touch targets**: All icon buttons meet WCAG 2.5.5
 * - **Semantic colors**: Uses design system tokens
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
 * Since Navbar is a pure presenter, all data must be passed via props.
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
  title: 'Components/Navbar',
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
 * Default desktop view with 3-zone layout and borderless design.
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
          'Desktop view with 3 zones: Context (help + breadcrumbs), Command (search), Actions (status + theme + user). Uses shadow-sm for borderless design.',
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
          'Mobile view with hamburger menu and mobile-optimized breadcrumbs. Fixed position with two rows.',
      },
    },
  },
};

/**
 * Navbar with admin mode enabled.
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
 * Light theme variant to demonstrate borderless shadow visibility.
 */
export const LightTheme: Story = {
  args: {
    ...defaultNavbarProps,
    isDesktop: true,
    theme: 'light',
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <MemoryRouter initialEntries={['/dashboard']}>
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
  parameters: {
    backgrounds: { default: 'light' },
    docs: {
      description: {
        story:
          'Light theme showing shadow-sm appearance. The subtle shadow provides visual separation without a hard border.',
      },
    },
  },
};

/**
 * Dark theme variant to demonstrate custom dark mode shadow.
 */
export const DarkTheme: Story = {
  args: {
    ...defaultNavbarProps,
    isDesktop: true,
    theme: 'dark',
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <MemoryRouter initialEntries={['/dashboard']}>
            <SidebarProvider defaultOpen={true}>
              <div className="bg-slate-950 min-h-[200px] dark">
                <Story />
              </div>
            </SidebarProvider>
          </MemoryRouter>
        </ThemeProvider>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story:
          'Dark theme with custom shadow (rgba(0,0,0,0.2)) for better visibility on dark backgrounds.',
      },
    },
  },
};

/**
 * Navbar with page hint displayed after breadcrumbs.
 */
export const WithPageHint: Story = {
  args: {
    ...defaultNavbarProps,
    isDesktop: true,
    crumbs: [{ label: 'Messages' }],
    pageTooltip: 'Messages - Incoming Telegram messages',
    pageHint: '12 new messages',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Navbar with contextual page hint displayed after breadcrumbs. Useful for showing counts or status.',
      },
    },
  },
};

/**
 * Navbar with user avatar.
 */
export const WithUserAvatar: Story = {
  args: {
    ...defaultNavbarProps,
    isDesktop: true,
    user: {
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://github.com/shadcn.png',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Navbar with user avatar displayed in the NavUser component. Falls back to initials if no avatar.',
      },
    },
  },
};
