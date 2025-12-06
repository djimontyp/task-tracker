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
 * - **Full-width content on large screens** (2K, 4K support)
 *
 * ## Large Screen Support (Design System Requirement)
 *
 * Per `docs/design-system/04-layout.md`:
 * - **No fixed max-width** — Content area uses `w-full` (NO `container` or `max-w-screen-*`)
 * - **Responsive padding** — `px-4 lg:px-6 xl:px-8 2xl:px-10`
 * - **Tables expand** — DataTable columns should utilize available width
 *
 * This ensures dashboards with data tables utilize full screen width on 2K/4K monitors.
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
// Mirrors actual MainLayout structure for accurate stories
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
          {/* Desktop Grid Layout (matches MainLayout.tsx) */}
          <div className="grid grid-cols-[auto_1fr] h-screen overflow-hidden bg-background">
            {/* Column 1: Sidebar */}
            <AppSidebar />

            {/* Column 2: Navbar + Content */}
            <div className="grid grid-rows-[56px_1fr] overflow-hidden">
              <Navbar isDesktop={true} />

              {/* Main content - FULL WIDTH (no container constraint) */}
              <SidebarInset className="overflow-auto">
                <main className="px-4 lg:px-6 xl:px-8 2xl:px-10 py-4 w-full">
                  {children}
                </main>
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
- **Navbar**: Contains logo (Radar icon 20px, matching sidebar icons), sidebar toggle, search, breadcrumb, user
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
          <SidebarProvider defaultOpen={false}>
            <div className="min-h-screen bg-background">
              <Navbar isDesktop={false} />
              <main className="pt-14 p-4">
                <SampleContent />
              </main>
            </div>
          </SidebarProvider>
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>
  ),
  parameters: {
    viewport: { defaultViewport: 'xs' },
    docs: {
      description: {
        story: 'Mobile view. Sidebar hidden, hamburger menu in navbar. Collapse button NOT visible (sidebar is Sheet on mobile).',
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
          <SidebarProvider defaultOpen={true}>
            <div className="bg-background">
              <Navbar />
              <div className="pt-14 p-4">
                <p className="text-muted-foreground">
                  Navbar contains logo, search bar, breadcrumb, and user controls.
                  Sidebar toggle is now in sidebar footer (not navbar).
                </p>
              </div>
            </div>
          </SidebarProvider>
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Navbar in isolation. Note: sidebar toggle moved to sidebar footer.',
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

// =============================================================================
// LARGE SCREEN SUPPORT (2K, 4K)
// =============================================================================

// Sample content that demonstrates full-width behavior
const FullWidthDemoContent = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">Large Screen Demo</h1>
      <span className="text-sm text-muted-foreground px-2 py-1 bg-muted rounded">
        Content uses full available width
      </span>
    </div>

    {/* Visual indicator showing content width */}
    <div className="h-2 bg-gradient-to-r from-primary via-primary/50 to-primary rounded-full" />

    <p className="text-muted-foreground">
      This content area expands to fill available width on large screens (2K, 4K).
      No <code className="px-1 bg-muted rounded">container</code> or{' '}
      <code className="px-1 bg-muted rounded">max-w-screen-*</code> constraints.
    </p>

    {/* Sample table to demonstrate expansion */}
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="text-left p-3 font-medium">Column 1</th>
            <th className="text-left p-3 font-medium">Column 2</th>
            <th className="text-left p-3 font-medium">Column 3</th>
            <th className="text-left p-3 font-medium">Column 4</th>
            <th className="text-left p-3 font-medium">Column 5</th>
            <th className="text-left p-3 font-medium">Column 6</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3].map((row) => (
            <tr key={row} className="border-t">
              <td className="p-3">Data {row}-1</td>
              <td className="p-3">Data {row}-2</td>
              <td className="p-3">Data {row}-3</td>
              <td className="p-3">Data {row}-4</td>
              <td className="p-3">Data {row}-5</td>
              <td className="p-3">Data {row}-6</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Metric {i}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{i * 123}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

/**
 * Full HD / 2K view (1920px)
 * Content expands to fill available width
 */
export const LargeScreen2K: Story = {
  render: () => (
    <LayoutWrapper defaultOpen={true}>
      <FullWidthDemoContent />
    </LayoutWrapper>
  ),
  parameters: {
    viewport: { defaultViewport: 'fullHD' },
    chromatic: { viewports: [1920] },
    docs: {
      description: {
        story: `
**Full HD / 2K (1920px)**

Content area expands to fill available width. Table columns and grids
utilize the extra horizontal space. Padding increases progressively:
\`px-4 lg:px-6 xl:px-8 2xl:px-10\`
        `,
      },
    },
  },
};

/**
 * QHD / 4K view (2560px)
 * Maximum content expansion
 */
export const LargeScreen4K: Story = {
  render: () => (
    <LayoutWrapper defaultOpen={true}>
      <FullWidthDemoContent />
    </LayoutWrapper>
  ),
  parameters: {
    viewport: { defaultViewport: 'qhd' },
    chromatic: { viewports: [2560] },
    docs: {
      description: {
        story: `
**QHD / 4K (2560px)**

Maximum content expansion. Data-heavy dashboards with tables
should utilize all available screen real estate on ultra-wide monitors.
        `,
      },
    },
  },
};

/**
 * ❌ Anti-pattern: Container constraint
 * This shows what NOT to do - constraining content with max-width
 */
export const AntiPatternContainerConstraint: Story = {
  render: () => (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <SidebarProvider defaultOpen={true}>
            <div className="grid grid-cols-[auto_1fr] h-screen overflow-hidden bg-background">
              <AppSidebar />
              <div className="grid grid-rows-[56px_1fr] overflow-hidden">
                <Navbar isDesktop={true} />
                <SidebarInset className="overflow-auto">
                  {/* ❌ WRONG: container max-w-screen-2xl limits width */}
                  <main className="container max-w-screen-2xl mx-auto p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-destructive">
                          ❌ Anti-pattern: Container Constraint
                        </h1>
                      </div>
                      <div className="p-4 border-2 border-destructive/50 rounded-lg bg-destructive/5">
                        <p className="text-sm">
                          This uses{' '}
                          <code className="px-1 bg-muted rounded">
                            container max-w-screen-2xl
                          </code>{' '}
                          which limits content to 1536px max width.
                        </p>
                        <p className="text-sm mt-2 text-muted-foreground">
                          On 2K/4K screens, there will be empty space on the sides.
                          This wastes valuable screen real estate for data tables.
                        </p>
                      </div>
                      <div className="h-2 bg-gradient-to-r from-destructive via-destructive/50 to-destructive rounded-full max-w-[1536px]" />
                    </div>
                  </main>
                </SidebarInset>
              </div>
            </div>
          </SidebarProvider>
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>
  ),
  parameters: {
    viewport: { defaultViewport: 'fullHD' },
    docs: {
      description: {
        story: `
**❌ Anti-pattern: Do NOT use \`container max-w-screen-2xl\`**

This constrains content to 1536px maximum width, wasting screen space
on large monitors. Data tables cannot expand to show more columns.

**Correct approach:** Use \`w-full\` with responsive padding.
        `,
      },
    },
  },
};
