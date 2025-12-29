import type { Meta, StoryObj } from '@storybook/react-vite';
import { HamburgerIcon } from './navbar-icons';
import { Button } from './button';

const meta: Meta<typeof HamburgerIcon> = {
  title: 'UI/NavbarIcons',
  component: HamburgerIcon,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Animated navigation icons for mobile menus. The HamburgerIcon transforms into an X when its parent has aria-expanded="true".',
      },
    },
  },
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};
export default meta;

type Story = StoryObj<typeof HamburgerIcon>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Default hamburger icon state (collapsed menu).',
      },
    },
  },
};

export const WithCustomSize: Story = {
  args: {
    className: 'h-6 w-6',
  },
  parameters: {
    docs: {
      description: {
        story: 'Hamburger icon with custom size via className.',
      },
    },
  },
};

export const WithCustomColor: Story = {
  args: {
    className: 'text-primary',
  },
  parameters: {
    docs: {
      description: {
        story: 'Hamburger icon with custom color using Tailwind text color class.',
      },
    },
  },
};

export const CollapsedState: Story = {
  render: () => (
    <button
      className="group p-2 rounded-md border hover:bg-muted"
      aria-expanded="false"
      aria-label="Open menu"
    >
      <HamburgerIcon />
    </button>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Hamburger icon in collapsed state (aria-expanded="false").',
      },
    },
  },
};

export const ExpandedState: Story = {
  render: () => (
    <button
      className="group p-2 rounded-md border hover:bg-muted"
      aria-expanded="true"
      aria-label="Close menu"
    >
      <HamburgerIcon />
    </button>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Hamburger icon transforms to X when parent has aria-expanded="true". The animation uses CSS transforms with cubic-bezier easing.',
      },
    },
  },
};

export const InteractiveToggle: Story = {
  render: function InteractiveDemo() {
    const [isExpanded, setIsExpanded] = React.useState(false);
    return (
      <div className="flex flex-col items-center gap-4">
        <button
          className="group p-2 rounded-md border hover:bg-muted transition-colors"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Close menu' : 'Open menu'}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <HamburgerIcon />
        </button>
        <p className="text-sm text-muted-foreground">
          Click to toggle: {isExpanded ? 'Expanded' : 'Collapsed'}
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showing the hamburger-to-X animation on click.',
      },
    },
  },
};

import React from 'react';

export const InNavbar: Story = {
  render: function NavbarDemo() {
    const [isOpen, setIsOpen] = React.useState(false);
    return (
      <nav className="w-80 flex items-center justify-between p-4 border rounded-lg bg-background">
        <span className="font-semibold">Logo</span>
        <Button
          variant="ghost"
          size="icon"
          className="group md:hidden"
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setIsOpen(!isOpen)}
        >
          <HamburgerIcon className="h-5 w-5" />
        </Button>
      </nav>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Hamburger icon used in a typical mobile navbar context.',
      },
    },
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <button className="group p-2 rounded-md border hover:bg-muted">
          <HamburgerIcon className="h-4 w-4" />
        </button>
        <span className="text-sm text-muted-foreground">16px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <button className="group p-2 rounded-md border hover:bg-muted">
          <HamburgerIcon />
        </button>
        <span className="text-sm text-muted-foreground">Default</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <button className="group p-2 rounded-md border hover:bg-muted">
          <HamburgerIcon className="h-6 w-6" />
        </button>
        <span className="text-sm text-muted-foreground">24px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <button className="group p-2 rounded-md border hover:bg-muted">
          <HamburgerIcon className="h-8 w-8" />
        </button>
        <span className="text-sm text-muted-foreground">32px</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison of different icon sizes.',
      },
    },
  },
};
