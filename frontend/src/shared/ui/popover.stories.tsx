import type { Meta, StoryObj } from '@storybook/react-vite';
import { Calendar, Settings, HelpCircle, User } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';

/**
 * Popover component - floating content anchored to trigger element.
 *
 * ## Design System Rules
 * - Positions: top, right, bottom, left (auto-adjusts for viewport)
 * - Keyboard accessible: ESC to close
 * - Closes on click outside or focus loss
 * - Use for contextual actions, filters, or additional info
 */
const meta: Meta<typeof Popover> = {
  title: 'UI/Popover',
  component: Popover,
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Controlled open state',
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A floating content container anchored to a trigger. Automatically positions to stay within viewport.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Popover>;

// Default popover
export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-2">
          <h4 className="font-medium leading-none">Quick Settings</h4>
          <p className="text-sm text-muted-foreground">
            Adjust your preferences without opening the full settings panel.
          </p>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="notifications" className="text-sm">
                Notifications
              </label>
              <input type="checkbox" id="notifications" className="h-4 w-4" />
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="sound" className="text-sm">
                Sound
              </label>
              <input type="checkbox" id="sound" className="h-4 w-4" defaultChecked />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Default popover with settings controls. Closes when clicking outside.',
      },
    },
  },
};

// Help popover
export const HelpInfo: Story = {
  render: () => (
    <div className="inline-flex items-center gap-2">
      <span className="text-sm">Your API Key</span>
      <Popover>
        <PopoverTrigger asChild>
          <button className="rounded-full hover:bg-accent" aria-label="Help information">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-2">
            <h4 className="font-medium">API Key Information</h4>
            <p className="text-sm text-muted-foreground">
              Your API key is used to authenticate requests to our service. Keep it secure and
              never share it publicly.
            </p>
            <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
              <li>Regenerate if compromised</li>
              <li>Use environment variables</li>
              <li>Rotate keys regularly</li>
            </ul>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Help popover with contextual information. Use for inline help without disrupting flow.',
      },
    },
  },
};

// User profile popover
export const UserProfile: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              JD
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium">John Doe</p>
              <p className="text-xs text-muted-foreground">john@example.com</p>
            </div>
          </div>
          <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-start" size="sm">
              Profile
            </Button>
            <Button variant="ghost" className="w-full justify-start" size="sm">
              Settings
            </Button>
            <Button variant="ghost" className="w-full justify-start" size="sm">
              Logout
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
  parameters: {
    docs: {
      description: {
        story: 'User profile popover with avatar and quick actions.',
      },
    },
  },
};

// Calendar date picker
export const DatePicker: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <Calendar className="h-4 w-4" />
          Pick a date
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="p-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Select Date</h4>
            <div className="grid grid-cols-7 gap-2 text-center text-xs">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="font-semibold text-muted-foreground">
                  {day}
                </div>
              ))}
              {Array.from({ length: 35 }).map((_, i) => {
                const date = i - 4;
                return (
                  <button
                    key={i}
                    className={`rounded-md p-2 hover:bg-accent ${
                      date > 0 && date <= 31 ? '' : 'invisible'
                    } ${date === 15 ? 'bg-primary text-primary-foreground' : ''}`}
                  >
                    {date > 0 && date <= 31 ? date : ''}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Popover with calendar UI. Example of custom content layout.',
      },
    },
  },
};

// Different alignments
export const Alignments: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Align Start</Button>
        </PopoverTrigger>
        <PopoverContent align="start">
          <p className="text-sm">Content aligned to start of trigger.</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Align Center</Button>
        </PopoverTrigger>
        <PopoverContent align="center">
          <p className="text-sm">Content centered on trigger (default).</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Align End</Button>
        </PopoverTrigger>
        <PopoverContent align="end">
          <p className="text-sm">Content aligned to end of trigger.</p>
        </PopoverContent>
      </Popover>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Popover alignment options: start, center (default), end.',
      },
    },
  },
};
