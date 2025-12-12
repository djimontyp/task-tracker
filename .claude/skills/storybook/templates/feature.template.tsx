/**
 * Template for features/*/components/ stories (Tier 3)
 *
 * Minimum: 2-4 stories covering Default, Empty, Loading, Error
 *
 * Replace:
 * - __COMPONENT_NAME__ → actual component name (e.g., RunCard)
 * - __FEATURE_NAME__ → feature domain (e.g., Analysis)
 * - __COMPONENT_FILE__ → file name (e.g., RunCard)
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@/shared/components/ThemeProvider';
import { __COMPONENT_NAME__ } from './__COMPONENT_FILE__';

// Mock data
const mockItem = {
  id: '1',
  name: 'Example Item',
  // Add typical props for your component
};

const mockItems = [
  { id: '1', name: 'Item 1' },
  { id: '2', name: 'Item 2' },
  { id: '3', name: 'Item 3' },
];

// Providers wrapper (add/remove based on hooks used)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const meta: Meta<typeof __COMPONENT_NAME__> = {
  title: 'Features/__FEATURE_NAME__/__COMPONENT_NAME__',
  component: __COMPONENT_NAME__,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <MemoryRouter>
            <Story />
          </MemoryRouter>
        </ThemeProvider>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: 'Brief description of the feature component.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof __COMPONENT_NAME__>;

// ═══════════════════════════════════════════════════════════════
// CORE STATES (REQUIRED)
// ═══════════════════════════════════════════════════════════════

/**
 * Default state with data
 */
export const Default: Story = {
  args: {
    // data: mockItem,
    // items: mockItems,
  },
};

/**
 * Empty state - no data available
 */
export const Empty: Story = {
  args: {
    // items: [],
    // data: null,
  },
};

/**
 * Loading state - data is being fetched
 */
export const Loading: Story = {
  args: {
    // isLoading: true,
  },
};

/**
 * Error state - fetch failed
 */
export const Error: Story = {
  args: {
    // error: new Error('Failed to load data'),
  },
};

// ═══════════════════════════════════════════════════════════════
// OPTIONAL STATES
// ═══════════════════════════════════════════════════════════════

// /**
//  * With many items - tests overflow/scrolling
//  */
// export const ManyItems: Story = {
//   args: {
//     items: Array.from({ length: 50 }, (_, i) => ({
//       id: String(i + 1),
//       name: `Item ${i + 1}`,
//     })),
//   },
// };

// /**
//  * Filtered view
//  */
// export const Filtered: Story = {
//   args: {
//     items: mockItems.slice(0, 1),
//     filterActive: true,
//   },
// };

// ═══════════════════════════════════════════════════════════════
// COMPOSITION (if component is used in layouts)
// ═══════════════════════════════════════════════════════════════

// export const InPage: Story = {
//   render: () => (
//     <div className="container mx-auto p-6">
//       <h1 className="text-2xl font-bold mb-4">Page Title</h1>
//       <__COMPONENT_NAME__ data={mockItem} />
//     </div>
//   ),
// };
