import type { Meta, StoryObj } from '@storybook/react-vite';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './alert';

/**
 * Alert component for displaying important messages.
 *
 * ## Design System Rules
 * - Use semantic variants: `default` (info), `destructive` (error)
 * - Always include icon for visual hierarchy (not just color)
 * - Icon positioned on the left with proper spacing
 * - WCAG AA contrast for text and icons
 */
const meta: Meta<typeof Alert> = {
  title: 'UI/Alert',
  component: Alert,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive'],
      description: 'Alert variant: default (info) or destructive (error)',
    },
  },
  parameters: {
    docs: {
      description: {
        component: 'Accessible alert component for displaying important messages with icons.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  args: {
    variant: 'default',
    children: (
      <>
        <Info className="h-4 w-4" />
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>
          You can add components to your app using the cli.
        </AlertDescription>
      </>
    ),
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: (
      <>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Your session has expired. Please log in again.
        </AlertDescription>
      </>
    ),
  },
};

export const InfoAlert: Story = {
  render: () => (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>Information</AlertTitle>
      <AlertDescription>
        Your API key will expire in 7 days. Consider renewing it soon.
      </AlertDescription>
    </Alert>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Info alert with informational icon (default variant).',
      },
    },
  },
};

export const SuccessAlert: Story = {
  render: () => (
    <Alert className="border-semantic-success text-semantic-success">
      <CheckCircle className="h-4 w-4" />
      <AlertTitle>Success</AlertTitle>
      <AlertDescription>
        Your changes have been saved successfully.
      </AlertDescription>
    </Alert>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Success alert with custom semantic color classes.',
      },
    },
  },
};

export const WarningAlert: Story = {
  render: () => (
    <Alert className="border-semantic-warning text-semantic-warning">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Warning</AlertTitle>
      <AlertDescription>
        This action cannot be undone. Make sure you have a backup.
      </AlertDescription>
    </Alert>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Warning alert with custom semantic color classes.',
      },
    },
  },
};

export const ErrorAlert: Story = {
  render: () => (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Failed to connect to the server. Please check your internet connection.
      </AlertDescription>
    </Alert>
  ),
};

export const WithoutTitle: Story = {
  render: () => (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>
        Your password must be at least 8 characters long.
      </AlertDescription>
    </Alert>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Alert with description only (no title).',
      },
    },
  },
};

export const WithList: Story = {
  render: () => (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Validation Errors</AlertTitle>
      <AlertDescription>
        <ul className="list-disc list-inside space-y-2 mt-2">
          <li>Email is required</li>
          <li>Password must be at least 8 characters</li>
          <li>Phone number format is invalid</li>
        </ul>
      </AlertDescription>
    </Alert>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Error alert with bulleted list of validation errors.',
      },
    },
  },
};

export const Compact: Story = {
  render: () => (
    <Alert className="py-2">
      <Info className="h-4 w-4" />
      <AlertDescription className="ml-2">
        New updates available. Refresh to see changes.
      </AlertDescription>
    </Alert>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Compact alert with reduced padding for inline notifications.',
      },
    },
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Information</AlertTitle>
        <AlertDescription>
          This is an informational message.
        </AlertDescription>
      </Alert>

      <Alert className="border-semantic-success text-semantic-success">
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>
          Operation completed successfully.
        </AlertDescription>
      </Alert>

      <Alert className="border-semantic-warning text-semantic-warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          Please review before proceeding.
        </AlertDescription>
      </Alert>

      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          An error occurred. Please try again.
        </AlertDescription>
      </Alert>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All alert variants: info, success, warning, error.',
      },
    },
  },
};
