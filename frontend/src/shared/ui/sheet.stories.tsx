import type { Meta, StoryObj } from '@storybook/react-vite';
import { Settings, User, Bell, Info } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from './sheet';
import { Button } from './button';

/**
 * Sheet component - slide-over panel from screen edge.
 *
 * ## Design System Rules
 * - Four positions: top, bottom, left, right (default: right)
 * - Keyboard accessible: ESC to close
 * - Focus trap: Tab cycles through focusable elements
 * - Mobile-first: max-width adjusts for mobile screens
 */
const meta: Meta<typeof Sheet> = {
  title: 'Primitives/Sheet',
  component: Sheet,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A slide-over panel that appears from screen edge. Useful for settings, filters, or contextual actions.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Sheet>;

// Default (right side)
export const Default: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Make changes to your account settings here. Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center justify-between">
            <label htmlFor="notifications" className="text-sm font-medium">
              Notifications
            </label>
            <input type="checkbox" id="notifications" className="h-4 w-4" />
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="dark-mode" className="text-sm font-medium">
              Dark Mode
            </label>
            <input type="checkbox" id="dark-mode" className="h-4 w-4" />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="language" className="text-sm font-medium">
              Language
            </label>
            <select id="language" className="rounded-md border px-4 py-2 text-sm">
              <option>English</option>
              <option>Ukrainian</option>
              <option>Spanish</option>
            </select>
          </div>
        </div>
        <SheetFooter>
          <Button>Save changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Default sheet slides in from right side. Common for settings panels.',
      },
    },
  },
};

// Left side
export const LeftSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <User className="h-4 w-4" />
          Profile
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>User Profile</SheetTitle>
          <SheetDescription>View and edit your profile information.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <input
              id="name"
              defaultValue="John Doe"
              className="rounded-md border px-4 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="bio" className="text-sm font-medium">
              Bio
            </label>
            <textarea
              id="bio"
              rows={4}
              placeholder="Tell us about yourself..."
              className="rounded-md border px-4 py-2 text-sm"
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Sheet slides in from left. Use for navigation or primary content.',
      },
    },
  },
};

// Top position
export const TopPosition: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <Bell className="h-4 w-4" />
          Notifications
        </Button>
      </SheetTrigger>
      <SheetContent side="top">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>You have 3 unread notifications.</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 py-4">
          <div className="rounded-md border p-4">
            <p className="text-sm font-medium">New message received</p>
            <p className="text-xs text-muted-foreground">2 minutes ago</p>
          </div>
          <div className="rounded-md border p-4">
            <p className="text-sm font-medium">Task completed</p>
            <p className="text-xs text-muted-foreground">1 hour ago</p>
          </div>
          <div className="rounded-md border p-4">
            <p className="text-sm font-medium">New follower</p>
            <p className="text-xs text-muted-foreground">3 hours ago</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Sheet slides down from top. Good for notifications or alerts.',
      },
    },
  },
};

// Bottom position
export const BottomPosition: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <Info className="h-4 w-4" />
          Help
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Quick Help</SheetTitle>
          <SheetDescription>Common questions and keyboard shortcuts.</SheetDescription>
        </SheetHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Keyboard Shortcuts</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>⌘K - Command palette</li>
              <li>ESC - Close panel</li>
              <li>⌘S - Save</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Resources</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>Documentation</li>
              <li>API Reference</li>
              <li>Support</li>
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Sheet slides up from bottom. Mobile-friendly for contextual actions.',
      },
    },
  },
};

// All positions showcase
export const AllPositions: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Top</Button>
        </SheetTrigger>
        <SheetContent side="top">
          <SheetHeader>
            <SheetTitle>Top Sheet</SheetTitle>
            <SheetDescription>Slides down from top edge.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Right</Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Right Sheet</SheetTitle>
            <SheetDescription>Slides in from right edge (default).</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Bottom</Button>
        </SheetTrigger>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Bottom Sheet</SheetTitle>
            <SheetDescription>Slides up from bottom edge.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Left</Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Left Sheet</SheetTitle>
            <SheetDescription>Slides in from left edge.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All four sheet positions side by side for comparison.',
      },
    },
  },
};
