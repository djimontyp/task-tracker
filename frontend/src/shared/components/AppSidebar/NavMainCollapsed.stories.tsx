import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { NavMainCollapsed } from './NavMainCollapsed';
import { SidebarProvider } from '@/shared/ui/sidebar';
import type { NavGroup } from './types';
import {
  Home,
  FileText,
  Users,
  BarChart,
  Settings,
  Inbox,
  Bot,
  Zap,
  MessageSquare,
  FolderKanban,
  Bell,
  Search,
  HelpCircle,
  Shield,
} from 'lucide-react';

// Initialize minimal i18n for stories
if (!i18n.isInitialized) {
  i18n.init({
    lng: 'en',
    resources: {
      en: {
        common: {
          'sidebar.items.dashboard': 'Dashboard',
          'sidebar.items.messages': 'Messages',
          'sidebar.items.topics': 'Topics',
          'sidebar.items.analysisRuns': 'Analysis Runs',
          'sidebar.items.proposals': 'Proposals',
          'sidebar.items.agents': 'AI Agents',
          'sidebar.items.providers': 'Providers',
          'sidebar.items.settings': 'Settings',
          'sidebar.items.inbox': 'Inbox',
          'sidebar.items.notifications': 'Notifications',
          'sidebar.items.search': 'Search',
          'sidebar.items.help': 'Help',
          'sidebar.items.security': 'Security',
        },
      },
    },
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  });
}

// Story wrapper with all required providers
const StoryWrapper = ({
  children,
  initialPath = '/',
}: {
  children: React.ReactNode;
  initialPath?: string;
}) => {
  return (
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[initialPath]}>
        <SidebarProvider defaultOpen={false}>
          <div className="w-16 bg-sidebar border rounded-lg p-2">
            {children}
          </div>
        </SidebarProvider>
      </MemoryRouter>
    </I18nextProvider>
  );
};

const meta: Meta<typeof NavMainCollapsed> = {
  title: 'Components/AppSidebar/NavMainCollapsed',
  component: NavMainCollapsed,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <StoryWrapper>
        <Story />
      </StoryWrapper>
    ),
  ],
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'sidebar',
      values: [
        { name: 'sidebar', value: 'hsl(220 14% 94%)' },
        { name: 'dark', value: 'hsl(20 14.3% 4.1%)' },
      ],
    },
    docs: {
      description: {
        component: `
Collapsed sidebar navigation showing only icons with tooltips.

## Features
- **Icon-only display** - Shows navigation items as icons when sidebar is collapsed
- **Tooltip labels** - Hovering shows the full label via tooltip
- **Active state** - Current page icon highlighted with primary accent
- **Touch-friendly** - 44px touch targets (size-11)
- **Screen reader support** - sr-only text for accessibility

## Design Tokens Used
- bg-primary/10 - Active icon background
- text-primary - Active icon color
- hover:bg-sidebar-accent - Hover background
- hover:text-sidebar-accent-foreground - Hover text color

## Spacing
- Icon size: size-5 (20px)
- Button size: size-11 (44px - proper touch target)
- Gap between items: gap-2 (8px)
        `,
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof NavMainCollapsed>;

// Realistic Pulse Radar navigation structure
const pulseRadarGroups: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: Home },
      { path: '/messages', label: 'Messages', icon: MessageSquare },
      { path: '/topics', label: 'Topics', icon: FolderKanban },
    ],
  },
  {
    label: 'AI Analysis',
    items: [
      { path: '/analysis', label: 'Analysis Runs', icon: Zap },
      { path: '/proposals', label: 'Proposals', icon: FileText },
    ],
  },
  {
    label: 'AI Config',
    items: [
      { path: '/agents', label: 'AI Agents', icon: Bot },
      { path: '/providers', label: 'Providers', icon: Settings },
    ],
  },
];

const simpleGroups: NavGroup[] = [
  {
    label: 'Main',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: Home },
      { path: '/inbox', label: 'Inbox', icon: Inbox },
      { path: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

const allIconsGroups: NavGroup[] = [
  {
    label: 'All Icons Demo',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: Home },
      { path: '/messages', label: 'Messages', icon: MessageSquare },
      { path: '/topics', label: 'Topics', icon: FolderKanban },
      { path: '/analysis', label: 'Analysis', icon: Zap },
      { path: '/proposals', label: 'Proposals', icon: FileText },
      { path: '/agents', label: 'Agents', icon: Bot },
      { path: '/providers', label: 'Providers', icon: Settings },
      { path: '/users', label: 'Users', icon: Users },
      { path: '/analytics', label: 'Analytics', icon: BarChart },
      { path: '/notifications', label: 'Notifications', icon: Bell },
      { path: '/search', label: 'Search', icon: Search },
      { path: '/help', label: 'Help', icon: HelpCircle },
      { path: '/security', label: 'Security', icon: Shield },
    ],
  },
];

export const Default: Story = {
  args: {
    groups: pulseRadarGroups,
    currentPath: '/dashboard',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default collapsed navigation with Dashboard active. All items from all groups are flattened into a single icon column.',
      },
    },
  },
};

export const WithActiveItem: Story = {
  args: {
    groups: pulseRadarGroups,
    currentPath: '/messages',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Collapsed navigation with Messages page active. The active icon has a primary accent background and text color.',
      },
    },
  },
};

export const DeepActiveItem: Story = {
  args: {
    groups: pulseRadarGroups,
    currentPath: '/agents',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Active item from a nested group (AI Config > Agents). Demonstrates that active state works for items from any group.',
      },
    },
  },
};

export const Empty: Story = {
  args: {
    groups: [],
    currentPath: '/dashboard',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Empty collapsed navigation with no items. The component renders an empty container.',
      },
    },
  },
};

export const SingleGroup: Story = {
  args: {
    groups: simpleGroups,
    currentPath: '/dashboard',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Collapsed navigation with a single group of 3 items. Minimal configuration.',
      },
    },
  },
};

export const AllIcons: Story = {
  args: {
    groups: allIconsGroups,
    currentPath: '/dashboard',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstration of all available navigation icons in collapsed state. Useful for visual reference of icon options.',
      },
    },
  },
};

export const SubpathActive: Story = {
  args: {
    groups: pulseRadarGroups,
    currentPath: '/topics/123',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Navigation with a subpath active (e.g., /topics/123). The Topics icon is highlighted because currentPath starts with /topics.',
      },
    },
  },
};
