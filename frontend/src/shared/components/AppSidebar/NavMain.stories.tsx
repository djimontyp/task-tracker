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
          'sidebar.items.dashboard': 'Dashboard',
          'sidebar.items.documents': 'Documents',
          'sidebar.items.members': 'Members',
          'sidebar.items.analytics': 'Analytics',
          'sidebar.items.inbox': 'Inbox',
          'sidebar.items.notifications': 'Notifications',
          'sidebar.items.settings': 'Settings',
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
  // Reset expanded groups on mount
  useEffect(() => {
    useUiStore.setState({ expandedGroups: {} });
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[initialPath]}>
        <SidebarProvider>
          <Sidebar className="border-r">
            <SidebarContent>{children}</SidebarContent>
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
    docs: {
      description: {
        component:
          'Main navigation component for AppSidebar. Supports collapsible groups, active item highlighting, and i18n.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof NavMain>;

const singleGroupItems: NavGroup[] = [
  {
    labelKey: 'sidebar.groups.workspace',
    items: [
      { path: '/', labelKey: 'sidebar.items.dashboard', icon: Home },
      { path: '/documents', labelKey: 'sidebar.items.documents', icon: FileText },
      { path: '/inbox', labelKey: 'sidebar.items.inbox', icon: Inbox },
    ],
  },
];

const multiGroupItems: NavGroup[] = [
  {
    labelKey: 'sidebar.groups.workspace',
    items: [
      { path: '/', labelKey: 'sidebar.items.dashboard', icon: Home },
      { path: '/documents', labelKey: 'sidebar.items.documents', icon: FileText },
    ],
  },
  {
    labelKey: 'sidebar.groups.team',
    items: [
      { path: '/members', labelKey: 'sidebar.items.members', icon: Users },
      { path: '/analytics', labelKey: 'sidebar.items.analytics', icon: BarChart },
    ],
  },
  {
    labelKey: 'sidebar.groups.settings',
    items: [
      { path: '/settings', labelKey: 'sidebar.items.settings', icon: Settings },
    ],
  },
];

export const SingleGroup: Story = {
  args: {
    groups: singleGroupItems,
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
  },
  parameters: {
    docs: {
      description: {
        story: 'Navigation with multiple groups separated by dividers.',
      },
    },
  },
};

export const WithActiveItem: Story = {
  args: {
    groups: multiGroupItems,
  },
  decorators: [
    (Story) => (
      <StoryWrapper initialPath="/documents">
        <Story />
      </StoryWrapper>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Navigation with Documents page active.',
      },
    },
  },
};

export const CollapsibleGroup: Story = {
  args: {
    groups: [
      {
        labelKey: 'sidebar.groups.workspace',
        items: [
          { path: '/', labelKey: 'sidebar.items.dashboard', icon: Home },
          { path: '/documents', labelKey: 'sidebar.items.documents', icon: FileText },
          { path: '/inbox', labelKey: 'sidebar.items.inbox', icon: Inbox },
          { path: '/notifications', labelKey: 'sidebar.items.notifications', icon: Bell },
        ],
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Groups with multiple items are collapsible. Click the group header to expand/collapse.',
      },
    },
  },
};

export const EmptyGroup: Story = {
  args: {
    groups: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Navigation with no groups (empty state).',
      },
    },
  },
};
