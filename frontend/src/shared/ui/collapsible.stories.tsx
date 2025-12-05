import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ChevronDown, ChevronRight, Info } from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './collapsible';
import { Button } from './button';

/**
 * Collapsible component for expandable content sections.
 *
 * ## Design System Rules
 * - Trigger must have adequate touch target (min 44px height on mobile)
 * - Expand/collapse icon should rotate or change to indicate state
 * - Keyboard navigation: Enter/Space to toggle, Tab to navigate
 * - Content animates smoothly using Radix UI data-state attributes
 */
const meta: Meta<typeof Collapsible> = {
  title: 'UI/Layout/Collapsible',
  component: Collapsible,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Accessible collapsible component built on Radix UI. Supports smooth animations and keyboard interaction.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Collapsible>;

// Basic collapsible
export const Default: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-[350px] space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Can I use this in my project?</h4>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 p-0">
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
              <span className="sr-only">Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <div className="rounded-md border px-4 py-2 text-sm">
          Yes. Free to use for personal and commercial projects.
        </div>
        <CollapsibleContent className="space-y-2">
          <div className="rounded-md border px-4 py-2 text-sm">
            No attribution required, but appreciated.
          </div>
          <div className="rounded-md border px-4 py-2 text-sm">
            Check the license file for details.
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Basic collapsible FAQ item. Click chevron to expand/collapse. Icon rotates to indicate state.',
      },
    },
  },
};

// With arrow icon
export const WithArrowIcon: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-[400px]">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="flex w-full justify-between p-4 font-semibold hover:bg-muted"
          >
            Advanced Settings
            <ChevronRight className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm">Enable debug mode</label>
              <input type="checkbox" />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm">Auto-save drafts</label>
              <input type="checkbox" />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm">Show line numbers</label>
              <input type="checkbox" />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Collapsible with arrow icon (ChevronRight). Arrow rotates 90deg when expanded.',
      },
    },
  },
};

// Multiple collapsibles (accordion-style)
export const MultipleItems: Story = {
  render: () => {
    const [open1, setOpen1] = useState(false);
    const [open2, setOpen2] = useState(false);
    const [open3, setOpen3] = useState(false);

    return (
      <div className="w-[500px] space-y-2">
        <Collapsible open={open1} onOpenChange={setOpen1} className="border rounded-md">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="flex w-full justify-between p-4 font-medium hover:bg-muted"
            >
              What is Pulse Radar?
              <ChevronDown
                className={`h-4 w-4 transition-transform ${open1 ? 'rotate-180' : ''}`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4 text-sm text-muted-foreground">
            Pulse Radar is an AI-powered knowledge extraction system that processes messages
            from communication channels like Telegram and Slack, filtering noise and extracting
            actionable insights.
          </CollapsibleContent>
        </Collapsible>

        <Collapsible open={open2} onOpenChange={setOpen2} className="border rounded-md">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="flex w-full justify-between p-4 font-medium hover:bg-muted"
            >
              How does it work?
              <ChevronDown
                className={`h-4 w-4 transition-transform ${open2 ? 'rotate-180' : ''}`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4 text-sm text-muted-foreground">
            Messages are ingested via webhooks, scored for importance, embedded with vector
            representations, and analyzed by AI agents to extract topics, atoms, and actionable
            tasks.
          </CollapsibleContent>
        </Collapsible>

        <Collapsible open={open3} onOpenChange={setOpen3} className="border rounded-md">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="flex w-full justify-between p-4 font-medium hover:bg-muted"
            >
              What are Atoms?
              <ChevronDown
                className={`h-4 w-4 transition-transform ${open3 ? 'rotate-180' : ''}`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4 text-sm text-muted-foreground">
            Atoms are the core knowledge units extracted from messages. They can be tasks,
            ideas, questions, decisions, or insights, organized into topics for easy discovery.
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Multiple independent collapsibles (FAQ style). Each can be toggled separately.',
      },
    },
  },
};

// With default open state
export const DefaultOpen: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-[400px] border rounded-md">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="flex w-full justify-between p-4 font-semibold hover:bg-muted"
          >
            <span className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Important Information
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4 text-sm text-muted-foreground">
          This section is expanded by default to draw attention to critical information.
          Users can collapse it after reading.
        </CollapsibleContent>
      </Collapsible>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Collapsible with default open state. Useful for important information that should be visible initially.',
      },
    },
  },
};

// Nested content
export const NestedContent: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-[500px] border rounded-md">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="flex w-full justify-between p-4 font-semibold hover:bg-muted"
          >
            Project Details
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4 space-y-4">
          <div>
            <h5 className="font-medium text-sm mb-2">Description</h5>
            <p className="text-sm text-muted-foreground">
              A comprehensive dashboard for monitoring AI-powered knowledge extraction.
            </p>
          </div>
          <div>
            <h5 className="font-medium text-sm mb-2">Technologies</h5>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
              <li>React 18 + TypeScript</li>
              <li>Tailwind CSS + shadcn/ui</li>
              <li>TanStack Query + Zustand</li>
              <li>FastAPI + PostgreSQL</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-sm mb-2">Status</h5>
            <span className="inline-flex items-center gap-2 px-2 py-2 rounded-md bg-semantic-success text-xs">
              Active
            </span>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Collapsible with rich nested content (headings, lists, badges).',
      },
    },
  },
};

// Controlled example (external button)
export const ControlledExternal: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="w-[400px] space-y-4">
        <Button onClick={() => setIsOpen(!isOpen)} variant="outline">
          {isOpen ? 'Hide' : 'Show'} Details
        </Button>
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-md p-4">
          <h4 className="font-semibold mb-2">User Information</h4>
          <CollapsibleContent className="space-y-2 text-sm text-muted-foreground">
            <div>
              <strong>Name:</strong> John Doe
            </div>
            <div>
              <strong>Email:</strong> john@example.com
            </div>
            <div>
              <strong>Role:</strong> Administrator
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Controlled collapsible with external toggle button. Useful when trigger is separate from content.',
      },
    },
  },
};
