/**
 * Template for shared/ui/ component stories (Tier 1)
 *
 * Minimum: 4-6 stories covering Default, Variants, States, Sizes
 *
 * Replace:
 * - __COMPONENT_NAME__ → actual component name (e.g., Button)
 * - __component_name__ → lowercase (e.g., button)
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { __COMPONENT_NAME__ } from './__component_name__';

/**
 * Brief description of what this component does and when to use it.
 *
 * @example
 * ```tsx
 * <__COMPONENT_NAME__ variant="default">Content</__COMPONENT_NAME__>
 * ```
 */
const meta: Meta<typeof __COMPONENT_NAME__> = {
  title: 'UI/__COMPONENT_NAME__',
  component: __COMPONENT_NAME__,
  tags: ['autodocs'],
  argTypes: {
    // Define controls for component props
    // variant: {
    //   control: 'select',
    //   options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    // },
    // size: {
    //   control: 'select',
    //   options: ['default', 'sm', 'lg', 'icon'],
    // },
  },
  parameters: {
    docs: {
      description: {
        component: 'Description of the component for autodocs.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof __COMPONENT_NAME__>;

// ═══════════════════════════════════════════════════════════════
// DEFAULT
// ═══════════════════════════════════════════════════════════════

export const Default: Story = {
  args: {
    children: 'Default',
  },
};

// ═══════════════════════════════════════════════════════════════
// VARIANTS (if applicable)
// ═══════════════════════════════════════════════════════════════

// export const Primary: Story = {
//   args: {
//     variant: 'default',
//     children: 'Primary',
//   },
// };

// export const Secondary: Story = {
//   args: {
//     variant: 'secondary',
//     children: 'Secondary',
//   },
// };

// export const Destructive: Story = {
//   args: {
//     variant: 'destructive',
//     children: 'Destructive',
//   },
// };

// export const Outline: Story = {
//   args: {
//     variant: 'outline',
//     children: 'Outline',
//   },
// };

// export const Ghost: Story = {
//   args: {
//     variant: 'ghost',
//     children: 'Ghost',
//   },
// };

// ═══════════════════════════════════════════════════════════════
// SIZES (if applicable)
// ═══════════════════════════════════════════════════════════════

// export const Small: Story = {
//   args: {
//     size: 'sm',
//     children: 'Small',
//   },
// };

// export const Large: Story = {
//   args: {
//     size: 'lg',
//     children: 'Large',
//   },
// };

// ═══════════════════════════════════════════════════════════════
// STATES
// ═══════════════════════════════════════════════════════════════

// export const Disabled: Story = {
//   args: {
//     disabled: true,
//     children: 'Disabled',
//   },
// };

// export const Loading: Story = {
//   args: {
//     // Add loading indicator
//     children: 'Loading...',
//   },
// };

// ═══════════════════════════════════════════════════════════════
// ALL VARIANTS (gallery view)
// ═══════════════════════════════════════════════════════════════

// export const AllVariants: Story = {
//   render: () => (
//     <div className="flex flex-wrap gap-4">
//       <__COMPONENT_NAME__ variant="default">Default</__COMPONENT_NAME__>
//       <__COMPONENT_NAME__ variant="secondary">Secondary</__COMPONENT_NAME__>
//       <__COMPONENT_NAME__ variant="destructive">Destructive</__COMPONENT_NAME__>
//       <__COMPONENT_NAME__ variant="outline">Outline</__COMPONENT_NAME__>
//       <__COMPONENT_NAME__ variant="ghost">Ghost</__COMPONENT_NAME__>
//     </div>
//   ),
// };
