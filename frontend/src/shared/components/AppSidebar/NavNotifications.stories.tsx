import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { NavNotifications } from './NavNotifications';
import { SidebarProvider, Sidebar, SidebarContent, SidebarMenu } from '@/shared/ui/sidebar';
import type { NavItem } from './types';
import type { SidebarCounts } from '@/shared/api/statsService';
import { BarChart, FileText } from 'lucide-react';

// Initialize minimal i18n for stories
if (!i18n.isInitialized) {
  i18n.init({
    lng: 'en',
    resources: {
      en: {
        common: {
          'sidebar.items.analysis': 'Analysis Runs',
          'sidebar.items.proposals': 'Proposals',
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
}) => (
  <I18nextProvider i18n={i18n}>
    <MemoryRouter initialEntries={[initialPath]}>
      <SidebarProvider>
        <Sidebar className="border-r w-64">
          <SidebarContent>
            <SidebarMenu>{children}</SidebarMenu>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </MemoryRouter>
  </I18nextProvider>
);

const meta: Meta<typeof NavNotifications> = {
  title: 'Components/AppSidebar/NavNotifications',
  component: NavNotifications,
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
          'Navigation item with notification badge. Shows count for analysis runs or proposals awaiting action.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof NavNotifications>;

const analysisItem: NavItem = {
  path: '/analysis',
  
  label: 'Analysis Runs',
  icon: BarChart,
};

const proposalsItem: NavItem = {
  path: '/proposals',
  
  label: 'Proposals',
  icon: FileText,
};

export const WithAnalysisCount: Story = {
  args: {
    item: analysisItem,
    currentPath: '/',
    counts: {
      unclosed_runs: 3,
      pending_proposals: 0,
    } as SidebarCounts,
  },
  parameters: {
    docs: {
      description: {
        story: 'Analysis runs item with 3 unclosed runs badge.',
      },
    },
  },
};

export const WithProposalsCount: Story = {
  args: {
    item: proposalsItem,
    currentPath: '/',
    counts: {
      unclosed_runs: 0,
      pending_proposals: 12,
    } as SidebarCounts,
  },
  parameters: {
    docs: {
      description: {
        story: 'Proposals item with 12 pending proposals badge.',
      },
    },
  },
};

export const WithSingleCount: Story = {
  args: {
    item: analysisItem,
    currentPath: '/',
    counts: {
      unclosed_runs: 1,
      pending_proposals: 0,
    } as SidebarCounts,
  },
  parameters: {
    docs: {
      description: {
        story: 'Single count shows singular tooltip ("1 unclosed analysis run").',
      },
    },
  },
};

export const NoCounts: Story = {
  args: {
    item: analysisItem,
    currentPath: '/',
    counts: {
      unclosed_runs: 0,
      pending_proposals: 0,
    } as SidebarCounts,
  },
  parameters: {
    docs: {
      description: {
        story: 'No badge when count is zero.',
      },
    },
  },
};

export const WithoutCounts: Story = {
  args: {
    item: analysisItem,
    currentPath: '/',
    counts: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: 'No badge when counts prop is not provided.',
      },
    },
  },
};

export const ActiveState: Story = {
  args: {
    item: analysisItem,
    currentPath: '/analysis',
    counts: {
      unclosed_runs: 5,
      pending_proposals: 0,
    } as SidebarCounts,
  },
  parameters: {
    docs: {
      description: {
        story: 'Active state with highlighted badge.',
      },
    },
  },
};

export const MultipleItems: Story = {
  render: () => {
    const counts: SidebarCounts = {
      unclosed_runs: 3,
      pending_proposals: 8,
    } as SidebarCounts;

    return (
      <>
        <NavNotifications item={analysisItem} currentPath="/" counts={counts} />
        <NavNotifications item={proposalsItem} currentPath="/" counts={counts} />
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Multiple notification items in a list.',
      },
    },
  },
};
