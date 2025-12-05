import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Button } from '@/shared/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import {
  FormField,
  InlineFormField,
  FormSection,
  FormActions,
  Fieldset,
} from './FormField';

/**
 * FormField pattern for consistent form layouts.
 *
 * Use this pattern for:
 * - Form fields with labels
 * - Validation error display
 * - Helper text / descriptions
 * - Required field indicators
 */
const meta: Meta<typeof FormField> = {
  title: 'Design System/Patterns/FormField',
  component: FormField,
  tags: ['autodocs'],
  argTypes: {
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof FormField>;

/**
 * Basic form field
 */
export const Basic: Story = {
  args: {
    label: 'Email',
    id: 'email',
    children: <Input type="email" id="email" placeholder="you@example.com" />,
  },
};

/**
 * Required field
 */
export const Required: Story = {
  args: {
    label: 'Username',
    id: 'username',
    required: true,
    children: <Input id="username" placeholder="Enter username" />,
  },
};

/**
 * With description
 */
export const WithDescription: Story = {
  args: {
    label: 'API Key',
    id: 'apiKey',
    description: 'Your API key will be encrypted and stored securely.',
    children: <Input id="apiKey" type="password" placeholder="sk-..." />,
  },
};

/**
 * With error
 */
export const WithError: Story = {
  args: {
    label: 'Email',
    id: 'email-error',
    required: true,
    error: 'Please enter a valid email address',
    children: <Input id="email-error" type="email" defaultValue="invalid-email" />,
  },
};

/**
 * Disabled field
 */
export const Disabled: Story = {
  args: {
    label: 'User ID',
    id: 'userId',
    disabled: true,
    description: 'This field cannot be edited',
    children: <Input id="userId" defaultValue="user-123-abc" disabled />,
  },
};

/**
 * With textarea
 */
export const WithTextarea: Story = {
  args: {
    label: 'Description',
    id: 'description',
    description: 'Provide a detailed description (max 500 characters)',
    children: (
      <Textarea
        id="description"
        placeholder="Enter description..."
        rows={4}
      />
    ),
  },
};

/**
 * With select
 */
export const WithSelect: Story = {
  args: {
    label: 'Provider',
    id: 'provider',
    required: true,
    children: (
      <Select>
        <SelectTrigger id="provider">
          <SelectValue placeholder="Select a provider" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="openai">OpenAI</SelectItem>
          <SelectItem value="anthropic">Anthropic</SelectItem>
          <SelectItem value="ollama">Ollama</SelectItem>
        </SelectContent>
      </Select>
    ),
  },
};

/**
 * InlineFormField variant
 */
export const Inline: Story = {
  render: () => (
    <div className="space-y-4">
      <InlineFormField label="Name" id="name" required>
        <Input id="name" placeholder="Enter name" />
      </InlineFormField>
      <InlineFormField label="Email" id="email" error="Invalid email">
        <Input id="email" type="email" defaultValue="invalid" />
      </InlineFormField>
      <InlineFormField label="Notes" id="notes" description="Optional notes">
        <Textarea id="notes" rows={2} />
      </InlineFormField>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'InlineFormField places label beside input for horizontal forms.',
      },
    },
  },
};

/**
 * FormSection for grouping fields
 */
export const Section: Story = {
  render: () => (
    <FormSection
      title="Account Settings"
      description="Update your account information"
    >
      <FormField label="Username" id="username" required>
        <Input id="username" defaultValue="john_doe" />
      </FormField>
      <FormField label="Email" id="email" required>
        <Input id="email" type="email" defaultValue="john@example.com" />
      </FormField>
      <FormField label="Bio" id="bio" description="Tell us about yourself">
        <Textarea id="bio" rows={3} />
      </FormField>
    </FormSection>
  ),
  parameters: {
    docs: {
      description: {
        story: 'FormSection groups related fields with a title and description.',
      },
    },
  },
};

/**
 * Fieldset for bordered grouping
 */
export const FieldsetExample: Story = {
  render: () => (
    <Fieldset legend="Contact Information">
      <FormField label="Phone" id="phone">
        <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
      </FormField>
      <FormField label="Address" id="address">
        <Textarea id="address" rows={2} />
      </FormField>
    </Fieldset>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Fieldset provides a bordered group with legend.',
      },
    },
  },
};

/**
 * FormActions for button placement
 */
export const Actions: Story = {
  render: () => (
    <div className="space-y-4">
      <FormField label="Name" id="name" required>
        <Input id="name" placeholder="Enter name" />
      </FormField>
      <FormField label="Email" id="email" required>
        <Input id="email" type="email" placeholder="you@example.com" />
      </FormField>
      <FormActions align="right">
        <Button variant="outline">Cancel</Button>
        <Button>Save Changes</Button>
      </FormActions>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'FormActions aligns buttons (left, right, center, between).',
      },
    },
  },
};

/**
 * Complete form example
 */
export const CompleteForm: Story = {
  render: () => (
    <div className="max-w-lg border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Create Provider</h2>

      <FormSection title="Basic Information">
        <FormField label="Provider Name" id="name" required>
          <Input id="name" placeholder="My Provider" />
        </FormField>
        <FormField
          label="Provider Type"
          id="type"
          required
          description="Choose the LLM provider type"
        >
          <Select>
            <SelectTrigger id="type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="anthropic">Anthropic</SelectItem>
              <SelectItem value="ollama">Ollama (Local)</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </FormSection>

      <FormSection title="Authentication" className="mt-6">
        <FormField
          label="API Key"
          id="apiKey"
          required
          description="Your API key will be encrypted"
        >
          <Input id="apiKey" type="password" placeholder="sk-..." />
        </FormField>
        <FormField label="Base URL" id="baseUrl" description="Optional custom endpoint">
          <Input id="baseUrl" placeholder="https://api.openai.com/v1" />
        </FormField>
      </FormSection>

      <FormActions align="right" className="mt-6">
        <Button variant="outline">Cancel</Button>
        <Button>Create Provider</Button>
      </FormActions>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete form example combining all patterns.',
      },
    },
  },
};
