import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { NavUser } from './NavUser';
import { TooltipProvider } from '@/shared/ui/tooltip';

const meta: Meta<typeof NavUser> = {
  title: 'Components/NavUser',
  component: NavUser,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <TooltipProvider>
        <MemoryRouter>
          <Story />
        </MemoryRouter>
      </TooltipProvider>
    ),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'User menu dropdown for navbar. Includes avatar, user info, settings link, and optional admin mode toggle.',
      },
    },
  },
  argTypes: {
    user: {
      description: 'User object with name, email, and optional avatar URL',
    },
    isAdminMode: {
      control: 'boolean',
      description: 'Whether admin mode is currently active',
    },
    onToggleAdminMode: {
      action: 'toggleAdminMode',
      description: 'Handler for admin mode toggle',
    },
  },
};
export default meta;

type Story = StoryObj<typeof NavUser>;

const defaultUser = {
  name: 'John Doe',
  email: 'john@example.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
};

export const Default: Story = {
  args: {
    user: defaultUser,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default user menu without admin mode toggle.',
      },
    },
  },
};

export const WithAdminModeEnabled: Story = {
  args: {
    user: defaultUser,
    isAdminMode: true,
    onToggleAdminMode: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'User menu with admin mode toggle enabled.',
      },
    },
  },
};

export const WithAdminModeDisabled: Story = {
  args: {
    user: defaultUser,
    isAdminMode: false,
    onToggleAdminMode: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'User menu with admin mode toggle available but disabled.',
      },
    },
  },
};

export const WithoutAvatar: Story = {
  args: {
    user: {
      name: 'Jane Smith',
      email: 'jane@example.com',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'User without avatar - shows initials fallback.',
      },
    },
  },
};

export const LongUserName: Story = {
  args: {
    user: {
      name: 'Alexandra Montgomery-Richardson',
      email: 'alexandra.montgomery-richardson@very-long-company.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alexandra',
    },
    isAdminMode: false,
    onToggleAdminMode: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Handling of long user names and email addresses with truncation.',
      },
    },
  },
};

export const Interactive: Story = {
  render: function InteractiveNavUser() {
    const [isAdmin, setIsAdmin] = useState(false);

    return (
      <div className="flex flex-col items-center gap-4">
        <NavUser
          user={defaultUser}
          isAdminMode={isAdmin}
          onToggleAdminMode={() => setIsAdmin((prev) => !prev)}
        />
        <span className="text-sm text-muted-foreground">
          Admin Mode: {isAdmin ? 'Enabled' : 'Disabled'}
        </span>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive example - click menu and toggle admin mode.',
      },
    },
  },
};

export const InNavbar: Story = {
  render: () => (
    <div className="flex items-center justify-between p-4 border rounded-lg w-96 bg-background">
      <span className="font-semibold">Pulse Radar</span>
      <NavUser
        user={defaultUser}
        isAdminMode={false}
        onToggleAdminMode={() => {}}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'NavUser positioned in a navbar context.',
      },
    },
  },
};
