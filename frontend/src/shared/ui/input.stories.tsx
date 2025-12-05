import type { Meta, StoryObj } from '@storybook/react-vite';
import { Mail, Search as SearchIcon, Lock, User } from 'lucide-react';
import { Input } from './input';
import { Label } from './label';

/**
 * Input component for text entry.
 *
 * ## Design System Rules
 * - Minimum height 36px (h-9) for WCAG 2.5.5 touch target compliance
 * - Always pair with Label for accessibility
 * - Use semantic type attributes (email, password, search, etc.)
 * - Include placeholder text for context
 */
const meta: Meta<typeof Input> = {
  title: 'UI/Forms/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search', 'tel', 'url'],
      description: 'HTML input type',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    disabled: {
      control: 'boolean',
    },
    required: {
      control: 'boolean',
    },
  },
  parameters: {
    docs: {
      description: {
        component: 'Text input with semantic types and accessibility features. Always use with Label component.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

// Basic variants
export const Default: Story = {
  args: {
    type: 'text',
    placeholder: 'Enter text...',
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-2">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="Email" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Input with Label for accessibility. Always connect via htmlFor and id.',
      },
    },
  },
};

export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'name@example.com',
  },
};

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter password',
  },
};

export const SearchInput: Story = {
  args: {
    type: 'search',
    placeholder: 'Search...',
  },
};

export const Number: Story = {
  args: {
    type: 'number',
    placeholder: '0',
    min: 0,
    max: 100,
  },
};

// With icons
export const WithLeadingIcon: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-2">
      <Label htmlFor="search">Search</Label>
      <div className="relative">
        <SearchIcon className="absolute left-4 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input id="search" type="search" placeholder="Search..." className="pl-10" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Input with leading icon using absolute positioning.',
      },
    },
  },
};

export const WithTrailingIcon: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-2">
      <Label htmlFor="email-icon">Email</Label>
      <div className="relative">
        <Input id="email-icon" type="email" placeholder="name@example.com" className="pr-10" />
        <Mail className="absolute right-4 top-2.5 h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  ),
};

// States
export const Disabled: Story = {
  args: {
    type: 'text',
    placeholder: 'Disabled input',
    disabled: true,
  },
};

export const ReadOnly: Story = {
  args: {
    type: 'text',
    value: 'Read-only value',
    readOnly: true,
  },
};

export const Required: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-2">
      <Label htmlFor="required">
        Username <span className="text-destructive">*</span>
      </Label>
      <Input id="required" type="text" placeholder="Required field" required />
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-2">
      <Label htmlFor="error">Email</Label>
      <Input
        id="error"
        type="email"
        placeholder="name@example.com"
        className="border-destructive focus-visible:ring-destructive"
        aria-invalid="true"
        aria-describedby="error-message"
      />
      <p id="error-message" className="text-sm text-destructive">
        Please enter a valid email address
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Error state with red border and error message. Use aria-invalid and aria-describedby.',
      },
    },
  },
};

// File upload
export const FileUpload: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-2">
      <Label htmlFor="file">Upload file</Label>
      <Input id="file" type="file" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'File input with custom styling for file upload button.',
      },
    },
  },
};

// Form example
export const LoginForm: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-4">
      <div className="grid gap-2">
        <Label htmlFor="login-email">Email</Label>
        <div className="relative">
          <User className="absolute left-4 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input id="login-email" type="email" placeholder="name@example.com" className="pl-10" />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="login-password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-4 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="login-password"
            type="password"
            placeholder="Enter password"
            className="pl-10"
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete login form example with icons and proper spacing.',
      },
    },
  },
};
