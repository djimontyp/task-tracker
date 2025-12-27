import type { Meta, StoryObj } from '@storybook/react-vite';
import { LanguageMismatchBadge } from './LanguageMismatchBadge';

/**
 * LanguageMismatchBadge displays a warning when AI-generated content language
 * differs from the expected project language.
 *
 * ## Use Cases
 * - Atoms created in different language than project default
 * - Messages with detected language mismatch
 * - Content requiring translation review
 *
 * ## Behavior
 * - Returns null when languages match or info is missing
 * - Shows warning badge with tooltip when mismatch detected
 */
const meta: Meta<typeof LanguageMismatchBadge> = {
  title: 'Components/LanguageMismatchBadge',
  component: LanguageMismatchBadge,
  tags: ['autodocs'],
  argTypes: {
    detectedLanguage: {
      control: 'select',
      options: ['uk', 'en', 'de', 'fr', undefined],
      description: 'Language detected in the content',
    },
    expectedLanguage: {
      control: 'select',
      options: ['uk', 'en', 'de', 'fr', undefined],
      description: 'Expected language for the project/context',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Warning badge for AI content language mismatches. Helps users identify when content may need translation review.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof LanguageMismatchBadge>;

/**
 * When detected language matches expected - badge renders nothing.
 * This is the normal case when content is in the correct language.
 */
export const NoMismatch: Story = {
  args: {
    detectedLanguage: 'uk',
    expectedLanguage: 'uk',
  },
  parameters: {
    docs: {
      description: {
        story: 'When languages match, component returns null (renders nothing).',
      },
    },
  },
};

/**
 * English content detected when Ukrainian expected.
 * Common scenario when AI generates content in wrong language.
 */
export const EnglishDetectedUkrainianExpected: Story = {
  args: {
    detectedLanguage: 'en',
    expectedLanguage: 'uk',
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows warning badge when English content is detected but Ukrainian is expected.',
      },
    },
  },
};

/**
 * Ukrainian content detected when English expected.
 */
export const UkrainianDetectedEnglishExpected: Story = {
  args: {
    detectedLanguage: 'uk',
    expectedLanguage: 'en',
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows warning badge when Ukrainian content is detected but English is expected.',
      },
    },
  },
};

/**
 * Missing detected language - badge renders nothing.
 * Handles edge case when language detection is not available.
 */
export const MissingDetectedLanguage: Story = {
  args: {
    detectedLanguage: undefined,
    expectedLanguage: 'uk',
  },
  parameters: {
    docs: {
      description: {
        story: 'When detected language is missing, component returns null.',
      },
    },
  },
};

/**
 * Missing expected language - badge renders nothing.
 * Handles edge case when project language is not configured.
 */
export const MissingExpectedLanguage: Story = {
  args: {
    detectedLanguage: 'en',
    expectedLanguage: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: 'When expected language is missing, component returns null.',
      },
    },
  },
};

/**
 * Both languages missing - badge renders nothing.
 */
export const BothLanguagesMissing: Story = {
  args: {
    detectedLanguage: undefined,
    expectedLanguage: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: 'When both languages are missing, component returns null.',
      },
    },
  },
};

/**
 * Badge with custom className for positioning.
 */
export const WithCustomClassName: Story = {
  args: {
    detectedLanguage: 'de',
    expectedLanguage: 'uk',
    className: 'ml-2',
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge accepts className prop for custom styling/positioning.',
      },
    },
  },
};

/**
 * Interactive example showing badge in context.
 */
export const InContext: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">Atom Title</span>
      <LanguageMismatchBadge detectedLanguage="en" expectedLanguage="uk" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example showing badge inline with content title.',
      },
    },
  },
};

/**
 * Multiple badges showing different mismatch scenarios.
 */
export const MultipleScenarios: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-2 border rounded">
        <span className="text-sm">No mismatch (uk/uk):</span>
        <LanguageMismatchBadge detectedLanguage="uk" expectedLanguage="uk" />
        <span className="text-xs text-muted-foreground">(renders nothing)</span>
      </div>
      <div className="flex items-center gap-2 p-2 border rounded">
        <span className="text-sm">Mismatch (en/uk):</span>
        <LanguageMismatchBadge detectedLanguage="en" expectedLanguage="uk" />
      </div>
      <div className="flex items-center gap-2 p-2 border rounded">
        <span className="text-sm">Mismatch (de/en):</span>
        <LanguageMismatchBadge detectedLanguage="de" expectedLanguage="en" />
      </div>
      <div className="flex items-center gap-2 p-2 border rounded">
        <span className="text-sm">Missing detected:</span>
        <LanguageMismatchBadge detectedLanguage={undefined} expectedLanguage="uk" />
        <span className="text-xs text-muted-foreground">(renders nothing)</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison of different scenarios side by side.',
      },
    },
  },
};
