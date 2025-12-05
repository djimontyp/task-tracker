import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { SidebarProvider, SidebarInset } from '@/shared/ui/sidebar';
import { AppSidebar } from '@/shared/components/AppSidebar';
import { ThemeProvider } from '@/shared/components/ThemeProvider';
import Navbar from './Navbar';

/**
 * MainLayout composition story showing Sidebar + Navbar harmony.
 *
 * Use this to verify:
 * - Logo placement (navbar only)
 * - Sidebar collapsed/expanded states
 * - Desktop vs mobile behavior
 * - Dark/light mode consistency
 */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// Wrapper with all required providers
const LayoutWrapper = ({
  children,
  defaultOpen = true,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <MemoryRouter initialEntries={['/dashboard']}>
        <SidebarProvider defaultOpen={defaultOpen}>
          <div className="min-h-screen bg-background">
            <Navbar />
            <div className="flex pt-14">
              <AppSidebar />
              <SidebarInset className="flex-1">
                <main className="p-4 lg:p-6">{children}</main>
              </SidebarInset>
            </div>
          </div>
        </SidebarProvider>
      </MemoryRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

// Sample content for stories
const SampleContent = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold">Dashboard</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Metric Card {i}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">123</p>
            <p className="text-sm text-muted-foreground">Sample metric</p>
          </CardContent>
        </Card>
      ))}
    </div>
    <Card>
      <CardHeader>
        <CardTitle>Content Area</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          This area shows how the main content looks next to the sidebar.
          The sidebar should have no logo header - navigation starts immediately.
          The logo with Radar icon is only in the navbar.
        </p>
      </CardContent>
    </Card>
  </div>
);

const meta: Meta = {
  title: 'Layout/MainLayout',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## Sidebar + Navbar Harmony

Shows the complete layout with:
- **Navbar**: Contains logo (Radar icon), sidebar toggle, search, breadcrumb, user
- **Sidebar**: Navigation only, NO header/logo (removed for clarity)

### Key Design Decisions
1. Logo appears ONLY in navbar (always visible)
2. Sidebar starts immediately with navigation items
3. Sidebar collapses to icon-only mode
4. Uses semantic color tokens
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Desktop with sidebar expanded (default state)
 */
export const DesktopExpanded: Story = {
  render: () => (
    <LayoutWrapper defaultOpen={true}>
      <SampleContent />
    </LayoutWrapper>
  ),
  parameters: {
    viewport: { defaultViewport: 'xl' },
    docs: {
      description: {
        story: 'Default desktop view with sidebar expanded. Logo in navbar, no logo in sidebar.',
      },
    },
  },
};

/**
 * Desktop with sidebar collapsed (icon-only)
 */
export const DesktopCollapsed: Story = {
  render: () => (
    <LayoutWrapper defaultOpen={false}>
      <SampleContent />
    </LayoutWrapper>
  ),
  parameters: {
    viewport: { defaultViewport: 'xl' },
    docs: {
      description: {
        story: 'Sidebar collapsed to icon-only mode. More space for content. Logo still visible in navbar.',
      },
    },
  },
};

/**
 * Tablet view (medium breakpoint)
 */
export const Tablet: Story = {
  render: () => (
    <LayoutWrapper defaultOpen={true}>
      <SampleContent />
    </LayoutWrapper>
  ),
  parameters: {
    viewport: { defaultViewport: 'md' },
    docs: {
      description: {
        story: 'Tablet view showing responsive behavior.',
      },
    },
  },
};

/**
 * Mobile view
 * Note: Full mobile drawer behavior requires Sheet component integration
 */
export const Mobile: Story = {
  render: () => (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pt-14 p-4">
              <SampleContent />
            </main>
          </div>
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>
  ),
  parameters: {
    viewport: { defaultViewport: 'xs' },
    docs: {
      description: {
        story: 'Mobile view. Sidebar is hidden (accessible via hamburger menu). Logo visible in navbar.',
      },
    },
  },
};

/**
 * Focus on Navbar only
 */
export const NavbarOnly: Story = {
  render: () => (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <div className="bg-background">
            <Navbar />
            <div className="pt-14 p-4">
              <p className="text-muted-foreground">
                Navbar contains the logo (Radar icon), search bar, breadcrumb, and user controls.
                Sidebar toggle moved to sidebar footer.
              </p>
            </div>
          </div>
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Navbar in isolation showing logo placement and controls.',
      },
    },
  },
};

/**
 * Focus on Sidebar only
 */
export const SidebarOnly: Story = {
  render: () => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <SidebarProvider defaultOpen={true}>
          <div className="flex min-h-[400px] border rounded-lg overflow-hidden">
            <AppSidebar />
            <div className="flex-1 p-4 bg-muted/30">
              <p className="text-muted-foreground">
                Sidebar starts immediately with navigation items.
                No header, no logo - clean and focused.
              </p>
            </div>
          </div>
        </SidebarProvider>
      </MemoryRouter>
    </QueryClientProvider>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Sidebar in isolation. Notice: no header/logo, navigation starts immediately.',
      },
    },
  },
};

/**
 * Sidebar collapsed state
 */
export const SidebarCollapsed: Story = {
  render: () => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <SidebarProvider defaultOpen={false}>
          <div className="flex min-h-[400px] border rounded-lg overflow-hidden">
            <AppSidebar />
            <div className="flex-1 p-4 bg-muted/30">
              <p className="text-muted-foreground">
                Sidebar in collapsed (icon-only) mode.
                Hover over icons to see tooltips.
              </p>
            </div>
          </div>
        </SidebarProvider>
      </MemoryRouter>
    </QueryClientProvider>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Sidebar collapsed to icons. Clean, minimal, functional.',
      },
    },
  },
};
