import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ColorPickerPopover } from './index';

const meta: Meta<typeof ColorPickerPopover> = {
  title: 'Patterns/ColorPickerPopover',
  component: ColorPickerPopover,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Color picker component with popover interface. Features hex color input, visual picker, and auto-pick functionality for topic colors.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ColorPickerPopover>;

// Wrapper component for interactive state
const ColorPickerWrapper = ({
  initialColor,
  disabled,
}: {
  initialColor: string;
  disabled?: boolean;
}) => {
  const [color, setColor] = useState(initialColor);

  const handleAutoPickClick = () => {
    // Generate random color
    const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
    setColor(randomColor);
  };

  return (
    <div className="flex items-center gap-4">
      <ColorPickerPopover
        color={color}
        onColorChange={setColor}
        onAutoPickClick={handleAutoPickClick}
        disabled={disabled}
      />
      <div className="text-sm">
        <p className="font-medium">Selected Color:</p>
        <p className="font-mono text-xs text-muted-foreground">{color}</p>
      </div>
    </div>
  );
};

export const Default: Story = {
  render: () => <ColorPickerWrapper initialColor="#3b82f6" />,
};

export const RedColor: Story = {
  render: () => <ColorPickerWrapper initialColor="#ef4444" />,
};

export const GreenColor: Story = {
  render: () => <ColorPickerWrapper initialColor="#10b981" />,
};

export const PurpleColor: Story = {
  render: () => <ColorPickerWrapper initialColor="#8b5cf6" />,
};

export const OrangeColor: Story = {
  render: () => <ColorPickerWrapper initialColor="#f97316" />,
};

export const DarkColor: Story = {
  render: () => <ColorPickerWrapper initialColor="#1e293b" />,
};

export const Disabled: Story = {
  render: () => <ColorPickerWrapper initialColor="#3b82f6" disabled />,
};

export const MultipleInstances: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium mb-2">Topic 1</p>
        <ColorPickerWrapper initialColor="#3b82f6" />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Topic 2</p>
        <ColorPickerWrapper initialColor="#ef4444" />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Topic 3</p>
        <ColorPickerWrapper initialColor="#10b981" />
      </div>
    </div>
  ),
};
