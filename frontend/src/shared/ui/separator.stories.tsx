import type { Meta, StoryObj } from '@storybook/react-vite';
import { Separator } from './separator';

/**
 * Separator component for visual dividers.
 *
 * ## Design System Rules
 * - Thickness: 1px for subtle separation
 * - Color: bg-border (semantic token, theme-aware)
 * - Orientation: horizontal (default) or vertical
 * - Decorative: true by default (aria-hidden for screen readers)
 */
const meta: Meta<typeof Separator> = {
  title: 'UI/Layout/Separator',
  component: Separator,
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Separator orientation',
    },
    decorative: {
      control: 'boolean',
      description: 'Whether separator is decorative (aria-hidden)',
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Accessible separator component built on Radix UI. Provides visual division between content sections.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Separator>;

// Horizontal separator (default)
export const Horizontal: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium">Section 1</h4>
        <p className="text-sm text-muted-foreground">Content for the first section.</p>
      </div>
      <Separator />
      <div>
        <h4 className="text-sm font-medium">Section 2</h4>
        <p className="text-sm text-muted-foreground">Content for the second section.</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Default horizontal separator. 1px height, full width. Used between vertically stacked content.',
      },
    },
  },
};

// Vertical separator
export const Vertical: Story = {
  render: () => (
    <div className="flex h-20 items-center gap-4">
      <div>
        <h4 className="text-sm font-medium">Left</h4>
        <p className="text-sm text-muted-foreground">Content</p>
      </div>
      <Separator orientation="vertical" />
      <div>
        <h4 className="text-sm font-medium">Middle</h4>
        <p className="text-sm text-muted-foreground">Content</p>
      </div>
      <Separator orientation="vertical" />
      <div>
        <h4 className="text-sm font-medium">Right</h4>
        <p className="text-sm text-muted-foreground">Content</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Vertical separator. 1px width, full height. Used between horizontally aligned content.',
      },
    },
  },
};

// In navigation menu
export const InNavigation: Story = {
  render: () => (
    <div className="w-[300px] border rounded-md p-4 space-y-2">
      <div className="space-y-2">
        <a href="#" className="block px-2 py-2.5 text-sm hover:bg-muted rounded-md">
          Dashboard
        </a>
        <a href="#" className="block px-2 py-2.5 text-sm hover:bg-muted rounded-md">
          Messages
        </a>
        <a href="#" className="block px-2 py-2.5 text-sm hover:bg-muted rounded-md">
          Topics
        </a>
      </div>
      <Separator />
      <div className="space-y-2">
        <a href="#" className="block px-2 py-2.5 text-sm hover:bg-muted rounded-md">
          Settings
        </a>
        <a href="#" className="block px-2 py-2.5 text-sm hover:bg-muted rounded-md">
          Help
        </a>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Separator in navigation menu to group related items.',
      },
    },
  },
};

// In card content
export const InCard: Story = {
  render: () => (
    <div className="w-[400px] border rounded-lg shadow-sm">
      <div className="p-6">
        <h3 className="text-lg font-semibold">User Profile</h3>
        <p className="text-sm text-muted-foreground">Manage your account information</p>
      </div>
      <Separator />
      <div className="p-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Name:</span>
            <span className="font-medium">John Doe</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Email:</span>
            <span className="font-medium">john@example.com</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Role:</span>
            <span className="font-medium">Administrator</span>
          </div>
        </div>
      </div>
      <Separator />
      <div className="p-6">
        <button className="text-sm text-primary hover:underline">Edit Profile</button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Separator in card to divide header, content, and footer sections.',
      },
    },
  },
};

// In toolbar
export const InToolbar: Story = {
  render: () => (
    <div className="flex items-center gap-2 p-2 border rounded-md">
      <button className="px-4 py-2.5 text-sm hover:bg-muted rounded-md">Bold</button>
      <button className="px-4 py-2.5 text-sm hover:bg-muted rounded-md">Italic</button>
      <button className="px-4 py-2.5 text-sm hover:bg-muted rounded-md">Underline</button>
      <Separator orientation="vertical" className="h-6" />
      <button className="px-4 py-2.5 text-sm hover:bg-muted rounded-md">Link</button>
      <button className="px-4 py-2.5 text-sm hover:bg-muted rounded-md">Image</button>
      <Separator orientation="vertical" className="h-6" />
      <button className="px-4 py-2.5 text-sm hover:bg-muted rounded-md">Undo</button>
      <button className="px-4 py-2.5 text-sm hover:bg-muted rounded-md">Redo</button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Vertical separators in toolbar to group related actions.',
      },
    },
  },
};

// In list items
export const InList: Story = {
  render: () => (
    <div className="w-[350px] border rounded-md p-4">
      <ul className="space-y-4">
        <li className="flex items-center justify-between">
          <span className="text-sm">Total Messages</span>
          <span className="text-sm font-semibold">1,234</span>
        </li>
        <Separator />
        <li className="flex items-center justify-between">
          <span className="text-sm">Signal Messages</span>
          <span className="text-sm font-semibold">456</span>
        </li>
        <Separator />
        <li className="flex items-center justify-between">
          <span className="text-sm">Noise Filtered</span>
          <span className="text-sm font-semibold">778</span>
        </li>
        <Separator />
        <li className="flex items-center justify-between">
          <span className="text-sm">Topics Created</span>
          <span className="text-sm font-semibold">23</span>
        </li>
      </ul>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Separator between list items for better visual separation.',
      },
    },
  },
};

// Custom spacing
export const CustomSpacing: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h4 className="text-sm font-medium">Tight spacing (my-2)</h4>
        <Separator className="my-2" />
        <p className="text-sm text-muted-foreground">Content below separator</p>
      </div>
      <div>
        <h4 className="text-sm font-medium">Default spacing (my-4)</h4>
        <Separator className="my-4" />
        <p className="text-sm text-muted-foreground">Content below separator</p>
      </div>
      <div>
        <h4 className="text-sm font-medium">Loose spacing (my-8)</h4>
        <Separator className="my-8" />
        <p className="text-sm text-muted-foreground">Content below separator</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Separator with custom spacing using Tailwind margin classes (4px grid: my-2, my-4, my-8).',
      },
    },
  },
};

// Full width vs constrained
export const WidthVariants: Story = {
  render: () => (
    <div className="space-y-8 w-[500px]">
      <div>
        <h4 className="text-sm font-medium mb-2">Full width (default)</h4>
        <Separator />
      </div>
      <div>
        <h4 className="text-sm font-medium mb-2">Constrained width (max-w-[200px])</h4>
        <Separator className="max-w-[200px]" />
      </div>
      <div>
        <h4 className="text-sm font-medium mb-2">Centered (max-w-[200px] mx-auto)</h4>
        <Separator className="max-w-[200px] mx-auto" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Separator with different width constraints using Tailwind classes.',
      },
    },
  },
};

// Semantic separator (non-decorative)
export const Semantic: Story = {
  render: () => (
    <div className="space-y-4">
      <article>
        <h3 className="text-lg font-semibold">Article Title</h3>
        <p className="text-sm text-muted-foreground">Article content goes here...</p>
      </article>
      <Separator decorative={false} />
      <article>
        <h3 className="text-lg font-semibold">Another Article</h3>
        <p className="text-sm text-muted-foreground">More content here...</p>
      </article>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Semantic separator (decorative={false}). Not hidden from screen readers, used for meaningful content division.',
      },
    },
  },
};
