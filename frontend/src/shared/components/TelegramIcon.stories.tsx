import type { Meta, StoryObj } from '@storybook/react-vite';
import { TelegramIcon } from './TelegramIcon';

const meta: Meta<typeof TelegramIcon> = {
  title: 'Components/Icons/TelegramIcon',
  component: TelegramIcon,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Telegram brand icon (paper plane). Simplified design for better visibility at small sizes.',
      },
    },
  },
  argTypes: {
    size: {
      control: { type: 'number', min: 12, max: 64, step: 4 },
      description: 'Size in pixels',
      table: {
        defaultValue: { summary: '16' },
      },
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};
export default meta;

type Story = StoryObj<typeof TelegramIcon>;

export const Default: Story = {
  args: {
    size: 16,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default size (16px) matching most UI icon usages.',
      },
    },
  },
};

export const Small: Story = {
  args: {
    size: 12,
  },
  parameters: {
    docs: {
      description: {
        story: 'Small size (12px) for compact layouts.',
      },
    },
  },
};

export const Medium: Story = {
  args: {
    size: 24,
  },
  parameters: {
    docs: {
      description: {
        story: 'Medium size (24px) for buttons and cards.',
      },
    },
  },
};

export const Large: Story = {
  args: {
    size: 32,
  },
  parameters: {
    docs: {
      description: {
        story: 'Large size (32px) for headers and empty states.',
      },
    },
  },
};

export const ExtraLarge: Story = {
  args: {
    size: 48,
  },
  parameters: {
    docs: {
      description: {
        story: 'Extra large size (48px) for hero sections.',
      },
    },
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      <div className="flex flex-col items-center gap-2">
        <TelegramIcon size={12} />
        <span className="text-xs text-muted-foreground">12px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <TelegramIcon size={16} />
        <span className="text-xs text-muted-foreground">16px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <TelegramIcon size={24} />
        <span className="text-xs text-muted-foreground">24px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <TelegramIcon size={32} />
        <span className="text-xs text-muted-foreground">32px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <TelegramIcon size={48} />
        <span className="text-xs text-muted-foreground">48px</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison of all icon sizes.',
      },
    },
  },
};

export const WithColor: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <TelegramIcon size={24} className="text-primary" />
      <TelegramIcon size={24} className="text-muted-foreground" />
      <TelegramIcon size={24} className="text-semantic-info" />
      <TelegramIcon size={24} className="text-semantic-success" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Icon with different semantic colors via className.',
      },
    },
  },
};

export const InButton: Story = {
  render: () => (
    <button className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
      <TelegramIcon size={16} />
      <span>Connect Telegram</span>
    </button>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Icon used inside a button with text.',
      },
    },
  },
};

export const InBadge: Story = {
  render: () => (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-semantic-info/10 text-semantic-info">
      <TelegramIcon size={12} />
      Telegram
    </span>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Icon used inside a badge for source indication.',
      },
    },
  },
};
