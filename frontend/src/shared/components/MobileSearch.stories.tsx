import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MobileSearch } from './MobileSearch';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Search } from 'lucide-react';

const meta: Meta<typeof MobileSearch> = {
  title: 'Components/MobileSearch',
  component: MobileSearch,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Mobile-friendly search sheet that slides from top. Used for responsive search interfaces on smaller screens.',
      },
    },
  },
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the search sheet is open',
    },
    onOpenChange: {
      action: 'openChange',
      description: 'Callback when open state changes',
    },
  },
};
export default meta;

type Story = StoryObj<typeof MobileSearch>;

export const Closed: Story = {
  args: {
    open: false,
    onOpenChange: () => {},
    children: <Input placeholder="Search..." />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Closed state - sheet is hidden.',
      },
    },
  },
};

export const Open: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    children: <Input placeholder="Search..." autoFocus />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Open state - sheet slides from top with search input.',
      },
    },
  },
};

export const Interactive: Story = {
  render: function InteractiveMobileSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');

    return (
      <div className="flex flex-col items-center gap-4">
        <Button variant="outline" onClick={() => setOpen(true)}>
          <Search className="h-4 w-4 mr-2" />
          Open Search
        </Button>

        <MobileSearch open={open} onOpenChange={setOpen}>
          <Input
            placeholder="Search messages, topics, atoms..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </MobileSearch>

        {query && (
          <span className="text-sm text-muted-foreground">
            Searching for: {query}
          </span>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive example with trigger button. Click to open, type to search.',
      },
    },
  },
};

export const WithSearchResults: Story = {
  render: function MobileSearchWithResults() {
    const [open, setOpen] = useState(true);

    return (
      <MobileSearch open={open} onOpenChange={setOpen}>
        <div className="space-y-4">
          <Input placeholder="Search..." defaultValue="react hooks" autoFocus />
          <div className="space-y-2">
            <div className="text-sm font-medium">Results (3)</div>
            <div className="p-2 rounded bg-muted text-sm">
              useEffect Hook Implementation
            </div>
            <div className="p-2 rounded bg-muted text-sm">
              Custom Hooks Best Practices
            </div>
            <div className="p-2 rounded bg-muted text-sm">
              React Query vs SWR
            </div>
          </div>
        </div>
      </MobileSearch>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Mobile search with example search results layout.',
      },
    },
  },
};
