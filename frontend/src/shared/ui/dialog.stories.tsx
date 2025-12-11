import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Trash2, Save, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
import { Button } from './button';

/**
 * Dialog component - modal overlay with focus trap.
 *
 * ## Design System Rules
 * - Keyboard accessible: ESC to close
 * - Focus trap: Tab cycles through focusable elements inside dialog
 * - Use destructive variant for delete confirmations
 * - Always provide DialogTitle for screen readers
 */
const meta: Meta<typeof Dialog> = {
  title: 'Primitives/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A modal dialog with overlay, focus trap, and keyboard navigation. Follows WCAG 2.1 AA guidelines.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Dialog>;

// Basic dialog
export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="name" className="text-right text-sm font-medium">
              Name
            </label>
            <input
              id="name"
              defaultValue="John Doe"
              className="col-span-3 rounded-md border px-4 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="email" className="text-right text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              defaultValue="john@example.com"
              className="col-span-3 rounded-md border px-4 py-2 text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">
            <Save className="h-4 w-4" />
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Basic dialog with form inputs and save action.',
      },
    },
  },
};

// Destructive action dialog
export const DestructiveAction: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="h-4 w-4" />
          Delete Item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your account and remove your
            data from our servers.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button variant="destructive">
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Dialog for destructive actions. Use red button variant and clear warning message.',
      },
    },
  },
};

// Information dialog
export const Information: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Info className="h-4 w-4" />
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Feature Information</DialogTitle>
          <DialogDescription>
            Learn more about this feature and how to use it effectively.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            This dialog provides important information about the feature you&apos;re using. It&apos;s
            designed to be non-blocking and easy to dismiss.
          </p>
          <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
            <li>Press ESC to close</li>
            <li>Click outside to dismiss</li>
            <li>Use Tab to navigate focusable elements</li>
          </ul>
        </div>
        <DialogFooter>
          <Button>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Information dialog with bullet points and single action button.',
      },
    },
  },
};

// Controlled state
export const Controlled: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [open, setOpen] = useState(false);

    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">Dialog open: {open ? 'Yes' : 'No'}</div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Open Controlled Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Controlled Dialog</DialogTitle>
              <DialogDescription>
                This dialog's state is controlled externally. Useful for programmatic control.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                The open state is managed in the parent component. You can close this dialog by
                clicking outside, pressing ESC, or using the button.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Dialog with controlled open state. Useful for programmatic control (e.g., forms).',
      },
    },
  },
};

// Long content with scroll
export const LongContent: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Long Dialog</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Terms of Service</DialogTitle>
          <DialogDescription>
            Please read our terms carefully before proceeding.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 text-sm">
          {Array.from({ length: 20 }).map((_, i) => (
            <p key={i} className="text-muted-foreground">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua. Section {i + 1}.
            </p>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline">Decline</Button>
          <Button>Accept</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dialog with scrollable content. Content exceeds viewport height.',
      },
    },
  },
};
