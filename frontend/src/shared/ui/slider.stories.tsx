import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { Slider } from './slider';
import { Label } from './label';

/**
 * Slider component for selecting values from a range.
 *
 * ## Design System Rules
 * - Minimum thumb size 16x16px for WCAG 2.5.5 touch target compliance
 * - Always pair with Label showing current value
 * - Use semantic step values (1, 5, 10)
 * - Include min/max indicators for context
 */
const meta: Meta<typeof Slider> = {
  title: 'UI/Forms/Slider',
  component: Slider,
  tags: ['autodocs'],
  argTypes: {
    min: {
      control: 'number',
      description: 'Minimum value',
    },
    max: {
      control: 'number',
      description: 'Maximum value',
    },
    step: {
      control: 'number',
      description: 'Step increment',
    },
    disabled: {
      control: 'boolean',
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Slider input built on Radix UI Slider primitive. Use for selecting numeric values from a range.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Slider>;

// Basic variants
export const Default: Story = {
  args: {
    defaultValue: [50],
    max: 100,
    step: 1,
  },
};

export const WithLabel: Story = {
  render: () => {
    const [value, setValue] = React.useState([50]);
    return (
      <div className="grid w-full max-w-sm gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="volume">Volume</Label>
          <span className="text-sm text-muted-foreground">{value[0]}%</span>
        </div>
        <Slider id="volume" value={value} onValueChange={setValue} max={100} step={1} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Slider with Label and live value display. Use onValueChange to update state.',
      },
    },
  },
};

export const WithMinMax: Story = {
  render: () => {
    const [value, setValue] = React.useState([20]);
    return (
      <div className="grid w-full max-w-sm gap-2">
        <Label htmlFor="brightness">Brightness: {value[0]}%</Label>
        <Slider id="brightness" value={value} onValueChange={setValue} max={100} step={1} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Slider with min/max labels for context.',
      },
    },
  },
};

export const CustomStep: Story = {
  render: () => {
    const [value, setValue] = React.useState([50]);
    return (
      <div className="grid w-full max-w-sm gap-2">
        <Label htmlFor="step">Custom step (5): {value[0]}</Label>
        <Slider id="step" value={value} onValueChange={setValue} max={100} step={5} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Slider with custom step increment (5).',
      },
    },
  },
};

export const CustomRange: Story = {
  render: () => {
    const [value, setValue] = React.useState([50]);
    return (
      <div className="grid w-full max-w-sm gap-2">
        <Label htmlFor="range">Price: ${value[0]}</Label>
        <Slider id="range" value={value} onValueChange={setValue} min={10} max={200} step={10} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>$10</span>
          <span>$200</span>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Slider with custom min/max range (10-200).',
      },
    },
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor="disabled">Disabled slider</Label>
      <Slider id="disabled" defaultValue={[50]} max={100} disabled />
    </div>
  ),
};

// Multiple sliders
export const MultipleSliders: Story = {
  render: () => {
    const [bass, setBass] = React.useState([50]);
    const [mid, setMid] = React.useState([50]);
    const [treble, setTreble] = React.useState([50]);

    return (
      <div className="grid w-full max-w-sm gap-6">
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="bass">Bass</Label>
            <span className="text-sm text-muted-foreground">{bass[0]}%</span>
          </div>
          <Slider id="bass" value={bass} onValueChange={setBass} max={100} />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="mid">Mid</Label>
            <span className="text-sm text-muted-foreground">{mid[0]}%</span>
          </div>
          <Slider id="mid" value={mid} onValueChange={setMid} max={100} />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="treble">Treble</Label>
            <span className="text-sm text-muted-foreground">{treble[0]}%</span>
          </div>
          <Slider id="treble" value={treble} onValueChange={setTreble} max={100} />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Multiple sliders for equalizer-style controls.',
      },
    },
  },
};

// Form example
export const SettingsForm: Story = {
  render: () => {
    const [volume, setVolume] = React.useState([75]);
    const [brightness, setBrightness] = React.useState([60]);
    const [fontSize, setFontSize] = React.useState([16]);

    return (
      <div className="grid w-full max-w-md gap-6">
        <div>
          <h3 className="mb-4 text-lg font-medium">Display Settings</h3>
          <div className="space-y-6">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="vol">Volume</Label>
                <span className="text-sm text-muted-foreground">{volume[0]}%</span>
              </div>
              <Slider id="vol" value={volume} onValueChange={setVolume} max={100} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Mute</span>
                <span>Max</span>
              </div>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bright">Brightness</Label>
                <span className="text-sm text-muted-foreground">{brightness[0]}%</span>
              </div>
              <Slider id="bright" value={brightness} onValueChange={setBrightness} max={100} />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="font">Font Size</Label>
                <span className="text-sm text-muted-foreground">{fontSize[0]}px</span>
              </div>
              <Slider
                id="font"
                value={fontSize}
                onValueChange={setFontSize}
                min={12}
                max={24}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>12px</span>
                <span>24px</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Complete settings form with multiple sliders and live value updates.',
      },
    },
  },
};
