import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
} from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from './command';

/**
 * Command component for command palette / search interface.
 *
 * ## Design System Rules
 * - Based on cmdk library with keyboard navigation
 * - Search input at top with magnifying glass icon
 * - Grouped items with semantic headings
 * - Keyboard shortcuts aligned to the right
 * - WCAG AA keyboard navigation support
 */
const meta: Meta<typeof Command> = {
  title: 'Primitives/Command',
  component: Command,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Command palette component for fast keyboard-driven actions and search.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Command>;

export const Default: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md">
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Calendar</span>
          </CommandItem>
          <CommandItem>
            <Smile className="mr-2 h-4 w-4" />
            <span>Search Emoji</span>
          </CommandItem>
          <CommandItem>
            <Calculator className="mr-2 h-4 w-4" />
            <span>Calculator</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

export const WithKeyboardShortcuts: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md">
      <CommandInput placeholder="Search commands..." />
      <CommandList>
        <CommandEmpty>No commands found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem>
            <span>New File</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>Open File</span>
            <CommandShortcut>⌘O</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>Save</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>Save As...</span>
            <CommandShortcut>⇧⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Edit">
          <CommandItem>
            <span>Cut</span>
            <CommandShortcut>⌘X</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>Copy</span>
            <CommandShortcut>⌘C</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>Paste</span>
            <CommandShortcut>⌘V</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Command palette with keyboard shortcuts displayed on the right.',
      },
    },
  },
};

export const SearchInterface: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md">
      <CommandInput placeholder="Search files, commands, or settings..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Recent Files">
          <CommandItem>📄 Project Overview.docx</CommandItem>
          <CommandItem>📊 Q4 Sales Report.xlsx</CommandItem>
          <CommandItem>🖼️ Logo Design v3.png</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Quick Actions">
          <CommandItem>
            <Calculator className="mr-2 h-4 w-4" />
            <span>Open Calculator</span>
          </CommandItem>
          <CommandItem>
            <Calendar className="mr-2 h-4 w-4" />
            <span>View Calendar</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Command used as a search interface with recent files and quick actions.',
      },
    },
  },
};

export const MultipleGroups: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md">
      <CommandInput placeholder="Type to search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          <CommandItem>Dashboard</CommandItem>
          <CommandItem>Messages</CommandItem>
          <CommandItem>Topics</CommandItem>
          <CommandItem>Settings</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Features">
          <CommandItem>Analysis Runs</CommandItem>
          <CommandItem>Task Proposals</CommandItem>
          <CommandItem>Agents</CommandItem>
          <CommandItem>Providers</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Help">
          <CommandItem>Documentation</CommandItem>
          <CommandItem>Keyboard Shortcuts</CommandItem>
          <CommandItem>Support</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Command palette with multiple grouped sections separated by dividers.',
      },
    },
  },
};

export const EmptyState: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md">
      <CommandInput placeholder="Search..." />
      <CommandList>
        <CommandEmpty>
          No results found. Try a different search term.
        </CommandEmpty>
      </CommandList>
    </Command>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Command palette showing empty state when no results match.',
      },
    },
  },
};

export const WithIcons: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md">
      <CommandInput placeholder="Search tools..." />
      <CommandList>
        <CommandEmpty>No tools found.</CommandEmpty>
        <CommandGroup heading="Tools">
          <CommandItem>
            <Calculator className="mr-2 h-4 w-4 text-primary" />
            <span>Calculator</span>
          </CommandItem>
          <CommandItem>
            <Calendar className="mr-2 h-4 w-4 text-primary" />
            <span>Calendar</span>
          </CommandItem>
          <CommandItem>
            <CreditCard className="mr-2 h-4 w-4 text-primary" />
            <span>Payments</span>
          </CommandItem>
          <CommandItem>
            <User className="mr-2 h-4 w-4 text-primary" />
            <span>Profile</span>
          </CommandItem>
          <CommandItem>
            <Settings className="mr-2 h-4 w-4 text-primary" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Command items with leading icons for better visual hierarchy.',
      },
    },
  },
};

export const Compact: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md max-w-md">
      <CommandInput placeholder="Quick search..." />
      <CommandList className="max-h-[200px]">
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup>
          <CommandItem>Dashboard</CommandItem>
          <CommandItem>Messages</CommandItem>
          <CommandItem>Topics</CommandItem>
          <CommandItem>Settings</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Compact command palette with limited height and width.',
      },
    },
  },
};
