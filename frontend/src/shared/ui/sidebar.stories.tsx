import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarSeparator,
} from './sidebar';
import {
  Home,
  Settings,
  Users,
  FileText,
  BarChart,
  LogOut,
} from 'lucide-react';

const meta: Meta<typeof Sidebar> = {
  title: 'UI/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Composable sidebar component with collapsible states, mobile support, and keyboard navigation (Cmd+B to toggle).',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Sidebar>;

const navItems = [
  { icon: Home, label: 'Dashboard', href: '/' },
  { icon: FileText, label: 'Documents', href: '/documents' },
  { icon: Users, label: 'Team', href: '/team' },
  { icon: BarChart, label: 'Analytics', href: '/analytics' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export const Default: Story = {
  render: () => (
    <SidebarProvider>
      <div className="flex min-h-[400px] w-full">
        <Sidebar>
          <SidebarHeader className="border-b">
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="h-8 w-8 rounded-lg bg-primary" />
              <span className="font-semibold">Acme Inc</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <div className="flex items-center gap-2 p-4 border-b">
            <SidebarTrigger />
            <span>Page Content</span>
          </div>
          <div className="p-4">
            <p className="text-muted-foreground">
              Press Cmd+B (or Ctrl+B) to toggle the sidebar.
            </p>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Default sidebar with header, navigation groups, and footer.',
      },
    },
  },
};

export const Collapsible: Story = {
  render: () => (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-[400px] w-full">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="h-8 w-8 rounded-lg bg-primary shrink-0" />
              <span className="font-semibold group-data-[collapsible=icon]:sr-only">
                Acme Inc
              </span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.slice(0, 3).map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton tooltip={item.label}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <div className="flex items-center gap-2 p-4 border-b">
            <SidebarTrigger />
            <span>Collapsible Sidebar</span>
          </div>
          <div className="p-4">
            <p className="text-muted-foreground">
              Click the trigger or press Cmd+B to expand/collapse.
            </p>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Collapsible sidebar that shows only icons when collapsed.',
      },
    },
  },
};

export const WithActiveItem: Story = {
  render: () => {
    const [active, setActive] = useState('/documents');

    return (
      <SidebarProvider>
        <div className="flex min-h-[400px] w-full">
          <Sidebar>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navItems.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          isActive={active === item.href}
                          onClick={() => setActive(item.href)}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <SidebarInset>
            <div className="p-4">
              <p>Active: {active}</p>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar with active item highlighting.',
      },
    },
  },
};

export const LoadingSkeleton: Story = {
  render: () => (
    <SidebarProvider>
      <div className="flex min-h-[400px] w-full">
        <Sidebar>
          <SidebarHeader className="border-b">
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <SidebarMenuItem key={i}>
                      <SidebarMenuSkeleton />
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <div className="p-4">
            <p className="text-muted-foreground">Loading state with skeletons.</p>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading state using SidebarMenuSkeleton.',
      },
    },
  },
};

export const MultipleGroups: Story = {
  render: () => (
    <SidebarProvider>
      <div className="flex min-h-[500px] w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Home className="h-4 w-4" />
                      <span>Dashboard</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <FileText className="h-4 w-4" />
                      <span>Documents</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Team</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Users className="h-4 w-4" />
                      <span>Members</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <BarChart className="h-4 w-4" />
                      <span>Reports</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Settings</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Settings className="h-4 w-4" />
                      <span>General</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <div className="p-4">
            <p>Multiple groups with separators.</p>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Sidebar with multiple navigation groups and separators.',
      },
    },
  },
};
