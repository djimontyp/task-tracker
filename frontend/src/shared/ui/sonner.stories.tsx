import type { Meta, StoryObj } from '@storybook/react-vite';
import { toast } from 'sonner';
import { Button } from './button';
import { Toaster } from './sonner';

/**
 * Toast notifications using Sonner library.
 *
 * ## Design System Rules
 * - Each toast type has colored icon matching semantic tokens
 * - Success: green CheckCircle, green border + bg
 * - Error: red AlertCircle, red border + bg
 * - Warning: yellow AlertTriangle, yellow border + bg
 * - Info: blue Info icon, blue border + bg
 * - WCAG AA compliant: icon + text (not just color)
 */
const meta: Meta = {
  title: 'Primitives/Toast',
  component: Toaster,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-h-[300px] p-4">
        <Toaster position="top-center" />
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Toast notifications with colored icons for visual differentiation. Uses semantic color tokens.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Success: Story = {
  render: () => (
    <Button
      onClick={() => toast.success('Operation completed successfully')}
      className="bg-semantic-success hover:bg-semantic-success/90"
    >
      Show Success Toast
    </Button>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Success toast with green CheckCircle icon and green-tinted background.',
      },
    },
  },
};

export const Error: Story = {
  render: () => (
    <Button
      variant="destructive"
      onClick={() => toast.error('Something went wrong. Please try again.')}
    >
      Show Error Toast
    </Button>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Error toast with red AlertCircle icon and red-tinted background.',
      },
    },
  },
};

export const Warning: Story = {
  render: () => (
    <Button
      variant="outline"
      className="border-semantic-warning text-semantic-warning hover:bg-semantic-warning/10"
      onClick={() => toast.warning('Please review before proceeding')}
    >
      Show Warning Toast
    </Button>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Warning toast with yellow AlertTriangle icon and yellow-tinted background.',
      },
    },
  },
};

export const Info: Story = {
  render: () => (
    <Button
      variant="outline"
      className="border-semantic-info text-semantic-info hover:bg-semantic-info/10"
      onClick={() => toast.info('Your session expires in 5 minutes')}
    >
      Show Info Toast
    </Button>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Info toast with blue Info icon and blue-tinted background.',
      },
    },
  },
};

export const WithDescription: Story = {
  render: () => (
    <div className="flex gap-2 flex-wrap">
      <Button
        variant="outline"
        onClick={() =>
          toast.success('Changes saved', {
            description: 'Your profile has been updated successfully.',
          })
        }
      >
        Success with description
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.error('Connection failed', {
            description: 'Please check your internet connection and try again.',
          })
        }
      >
        Error with description
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Toasts can include a description for additional context.',
      },
    },
  },
};

export const WithAction: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() =>
        toast.error('File deleted', {
          description: 'This action cannot be undone.',
          action: {
            label: 'Undo',
            onClick: () => toast.success('File restored'),
          },
        })
      }
    >
      Toast with action
    </Button>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Toasts can include action buttons for user interaction.',
      },
    },
  },
};

export const AllTypes: Story = {
  render: () => (
    <div className="flex gap-2 flex-wrap">
      <Button
        className="bg-semantic-success hover:bg-semantic-success/90"
        onClick={() => toast.success('Success message')}
      >
        Success
      </Button>
      <Button variant="destructive" onClick={() => toast.error('Error message')}>
        Error
      </Button>
      <Button
        variant="outline"
        className="border-semantic-warning text-semantic-warning"
        onClick={() => toast.warning('Warning message')}
      >
        Warning
      </Button>
      <Button
        variant="outline"
        className="border-semantic-info text-semantic-info"
        onClick={() => toast.info('Info message')}
      >
        Info
      </Button>
      <Button variant="outline" onClick={() => toast('Default message')}>
        Default
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All toast types side by side for comparison.',
      },
    },
  },
};

export const PromiseToast: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() => {
        const asyncTask = new window.Promise<void>((resolve) =>
          setTimeout(resolve, 2000)
        );
        toast.promise(asyncTask, {
          loading: 'Loading...',
          success: 'Data loaded successfully',
          error: 'Failed to load data',
        });
      }}
    >
      Toast with Promise
    </Button>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Promise-based toast that shows loading, success, or error states.',
      },
    },
  },
};
