import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { HexColorPickerComponent } from './HexColorPicker';

const meta: Meta<typeof HexColorPickerComponent> = {
  title: 'Features/Topics/HexColorPicker',
  component: HexColorPickerComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Full-featured color picker for topic colors. Includes visual color picker, hex input with validation, 19 preset colors, and copy-to-clipboard. Uses react-colorful library with custom styling.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    selectedColor: {
      control: 'color',
      description: 'Initial selected color (hex format)',
    },
    onColorChange: {
      action: 'color changed',
      description: 'Callback fired when color changes',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof HexColorPickerComponent>;

/**
 * Default color picker with gray preset
 */
export const Default: Story = {
  args: {
    selectedColor: '#6b7280',
    onColorChange: (color: string) => console.log('Color changed:', color),
  },
};

/**
 * Interactive example with state
 */
export const Interactive: Story = {
  render: () => {
    const [color, setColor] = useState('#2563eb');
    return (
      <div className="space-y-4">
        <HexColorPickerComponent selectedColor={color} onColorChange={setColor} />
        <div className="text-center text-sm text-muted-foreground">
          Current color: <span className="font-mono font-bold">{color}</span>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Try changing color using picker, input, or preset buttons - updates in real-time',
      },
    },
  },
};

/**
 * Red color selected
 */
export const RedColor: Story = {
  args: {
    selectedColor: '#dc2626',
    onColorChange: () => {},
  },
};

/**
 * Blue color selected
 */
export const BlueColor: Story = {
  args: {
    selectedColor: '#2563eb',
    onColorChange: () => {},
  },
};

/**
 * Green color selected
 */
export const GreenColor: Story = {
  args: {
    selectedColor: '#16a34a',
    onColorChange: () => {},
  },
};

/**
 * Purple color selected
 */
export const PurpleColor: Story = {
  args: {
    selectedColor: '#9333ea',
    onColorChange: () => {},
  },
};

/**
 * No initial color (uses default gray)
 */
export const NoInitialColor: Story = {
  args: {
    selectedColor: null,
    onColorChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'When no color provided, defaults to #6b7280 (gray)',
      },
    },
  },
};

/**
 * Features demonstration
 */
export const Features: Story = {
  render: () => {
    const [color, setColor] = useState('#7c3aed');
    return (
      <div className="space-y-6">
        <HexColorPickerComponent selectedColor={color} onColorChange={setColor} />
        <div className="space-y-2 text-sm">
          <h4 className="font-semibold">Features:</h4>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Visual color picker with saturation/hue controls</li>
            <li>Hex input with validation (shows red border on invalid input)</li>
            <li>19 preset colors (44px touch targets, WCAG compliant)</li>
            <li>Current color display with copy button</li>
            <li>Dark mode support via semantic tokens</li>
          </ul>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Complete overview of all color picker features',
      },
    },
  },
};

/**
 * Preset colors grid
 */
export const PresetColors: Story = {
  args: {
    selectedColor: '#84cc16',
    onColorChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          '19 preset colors: red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose, gray, slate',
      },
    },
  },
};

/**
 * Accessibility features
 */
export const Accessibility: Story = {
  args: {
    selectedColor: '#0ea5e9',
    onColorChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'Accessible design: 44px touch targets, aria-labels on preset buttons, keyboard navigation, focus indicators, semantic HTML',
      },
    },
  },
};

/**
 * Dark mode compatibility
 */
export const DarkMode: Story = {
  args: {
    selectedColor: '#c026d3',
    onColorChange: () => {},
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Color picker uses semantic tokens (bg-muted, text-foreground) for dark mode support',
      },
    },
  },
};

/**
 * Mobile responsive view
 */
export const Mobile: Story = {
  args: {
    selectedColor: '#0891b2',
    onColorChange: () => {},
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Color picker is responsive - preset grid adapts to smaller screens (grid-cols-6)',
      },
    },
  },
};
