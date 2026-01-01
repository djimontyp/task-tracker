import { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { NavMain } from './NavMain';
import { SidebarProvider, Sidebar, SidebarContent } from '@/shared/ui/sidebar';
import { useUiStore } from '@/shared/store/uiStore';
import type { NavGroup } from './types';
import {
  Home,
  FileText,
  Users,
  BarChart,
  Settings,
  Inbox,
  Bell,
  Bot,
  Zap,
  MessageSquare,
  FolderKanban,
} from 'lucide-react';

// Initialize minimal i18n for stories
if (!i18n.isInitialized) {
  i18n.init({
    lng: 'en',
    resources: {
      en: {
        common: {
          'sidebar.groups.workspace': 'Workspace',
          'sidebar.groups.team': 'Team',
          'sidebar.groups.settings': 'Settings',
          'sidebar.groups.aiAnalysis': 'AI Analysis',
          'sidebar.groups.aiConfig': 'AI Config',
          'sidebar.items.dashboard': 'Dashboard',
          'sidebar.items.documents': 'Documents',
          'sidebar.items.members': 'Members',
          'sidebar.items.analytics': 'Analytics',
          'sidebar.items.inbox': 'Inbox',
          'sidebar.items.notifications': 'Notifications',
          'sidebar.items.settings': 'Settings',
          'sidebar.items.messages': 'Messages',
          'sidebar.items.topics': 'Topics',
          'sidebar.items.analysisRuns': 'Analysis Runs',
          'sidebar.items.proposals': 'Proposals',
          'sidebar.items.agents': 'AI Agents',
          'sidebar.items.providers': 'LLM Providers',
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
  defaultOpen = true,
}: {
  children: React.ReactNode;
  initialPath?: string;
  defaultOpen?: boolean;
}) => {
  // Reset expanded groups on mount
  useEffect(() => {
    useUiStore.setState({ expandedGroups: {} });
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[initialPath]}>
        <SidebarProvider defaultOpen={defaultOpen}>
          <Sidebar className="border-r border-sidebar-border">
            <SidebarContent className="pt-4">{children}</SidebarContent>
          </Sidebar>
        </SidebarProvider>
      </MemoryRouter>
    </I18nextProvider>
  );
};

const meta: Meta<typeof NavMain> = {
  title: 'Components/AppSidebar/NavMain',
  component: NavMain,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <StoryWrapper>
        <Story />
      </StoryWrapper>
    ),
  ],
  parameters: {
    layout: 'padded',
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
Main navigation component for the AppSidebar.

## Features
- **Collapsible groups** - Groups with multiple items can be expanded/collapsed
- **Active item highlighting** - Current page shows with accent background and left indicator bar
- **i18n support** - All labels use translation keys
- **Keyboard navigation** - Full focus management
- **Design System compliant** - Uses semantic color tokens and 4px spacing grid

## Design Tokens Used
- \`text-sidebar-foreground/60\` - Group labels (muted)
- \`bg-sidebar-accent\` - Active/hover item background
- \`bg-sidebar-primary\` - Active indicator bar
- \`text-sidebar-primary\` - Active item icon

## Spacing
- Group padding: \`py-2\` (8px vertical)
- Menu item gap: \`gap-1\` (4px)
- Item height: \`h-10\` (40px - close to 44px touch target)
        `,
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof NavMain>;

// Realistic Pulse Radar navigation structure
const pulseRadarGroups: NavGroup[] = [
  {
    
    label: 'Workspace',
    items: [
      { path: '/',  label: 'Dashboard', icon: Home },
      { path: '/messages',  label: 'Messages', icon: MessageSquare },
      { path: '/topics',  label: 'Topics', icon: FolderKanban },
    ],
  },
  {
    
    label: 'AI Analysis',
    items: [
      { path: '/analysis',  label: 'Analysis Runs', icon: Zap },
      { path: '/proposals',  label: 'Proposals', icon: FileText },
    ],
  },
  {
    
    label: 'AI Config',
    items: [
      { path: '/agents',  label: 'AI Agents', icon: Bot },
      { path: '/providers',  label: 'Providers', icon: Settings },
    ],
  },
];

const singleGroupItems: NavGroup[] = [
  {
    
    label: 'Workspace',
    items: [
      { path: '/',  label: 'Dashboard', icon: Home },
      { path: '/documents',  label: 'Documents', icon: FileText },
      { path: '/inbox',  label: 'Inbox', icon: Inbox },
    ],
  },
];

const multiGroupItems: NavGroup[] = [
  {
    
    label: 'Workspace',
    items: [
      { path: '/',  label: 'Dashboard', icon: Home },
      { path: '/documents',  label: 'Documents', icon: FileText },
    ],
  },
  {
    
    label: 'Team',
    items: [
      { path: '/members',  label: 'Members', icon: Users },
      { path: '/analytics',  label: 'Analytics', icon: BarChart },
    ],
  },
  {
    
    label: 'Settings',
    items: [
      { path: '/settings',  label: 'Settings', icon: Settings },
    ],
  },
];

export const Default: Story = {
  args: {
    groups: pulseRadarGroups,
    currentPath: '/',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default navigation state with Dashboard active. Shows realistic Pulse Radar navigation structure.',
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
        story: 'Navigation with Messages page active. Note the teal indicator bar on the left side of the active item.',
      },
    },
  },
};

export const SingleGroup: Story = {
  args: {
    groups: singleGroupItems,
    currentPath: '/',
  },
  parameters: {
    docs: {
      description: {
        story: 'Navigation with a single group of items.',
      },
    },
  },
};

export const MultipleGroups: Story = {
  args: {
    groups: multiGroupItems,
    currentPath: '/',
  },
  parameters: {
    docs: {
      description: {
        story: 'Navigation with multiple groups separated by subtle dividers.',
      },
    },
  },
};

export const CollapsibleGroup: Story = {
  args: {
    groups: [
      {
        
        label: 'Workspace',
        items: [
          { path: '/',  label: 'Dashboard', icon: Home },
          { path: '/documents',  label: 'Documents', icon: FileText },
          { path: '/inbox',  label: 'Inbox', icon: Inbox },
          { path: '/notifications',  label: 'Notifications', icon: Bell },
        ],
      },
    ],
    currentPath: '/',
  },
  parameters: {
    docs: {
      description: {
        story: 'Groups with multiple items are collapsible. Click the group header to expand/collapse. The chevron rotates to indicate state.',
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
        story: 'Active item in the third group (AI Config > Agents). Demonstrates that active state works across all groups.',
      },
    },
  },
};

export const EmptyGroup: Story = {
  args: {
    groups: [],
    currentPath: '/',
  },
  parameters: {
    docs: {
      description: {
        story: 'Navigation with no groups (empty state). The component renders an empty nav element.',
      },
    },
  },
};
