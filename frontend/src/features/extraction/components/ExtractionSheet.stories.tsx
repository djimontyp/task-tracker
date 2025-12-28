import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ExtractionSheet, ExtractionConfig } from './ExtractionSheet';
import { Button } from '@/shared/ui/button';
import { Sparkles } from 'lucide-react';

const meta: Meta<typeof ExtractionSheet> = {
  title: 'Features/Extraction/ExtractionSheet',
  component: ExtractionSheet,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A slide-out sheet panel for configuring and launching AI extraction runs.

## Features
- **Period Selection**: Quick period buttons (1h, 24h, 7d, Custom) with keyboard shortcuts (1-4)
- **Score Filtering**: Filter messages by importance score
- **Provider Selection**: Choose AI provider with speed/cost indicators
- **Live Preview**: Real-time estimates for messages, atoms, time, and cost
- **Keyboard Shortcuts**: Ctrl/Cmd+Enter to start extraction

## Accessibility
- Full keyboard navigation
- Focus trap within sheet
- Screen reader optimized
- WCAG AA compliant contrast
        `,
      },
    },
  },
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Controls sheet visibility',
    },
    totalMessages: {
      control: { type: 'number', min: 0, max: 10000 },
      description: 'Total available messages for context',
    },
    isExtracting: {
      control: 'boolean',
      description: 'Whether extraction is in progress',
    },
    extractionProgress: {
      control: { type: 'range', min: 0, max: 100 },
      description: 'Current extraction progress (0-100)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ExtractionSheet>;

// Interactive wrapper for controlled state
function ExtractionSheetDemo(props: Partial<React.ComponentProps<typeof ExtractionSheet>>) {
  const [open, setOpen] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleExtract = (config: ExtractionConfig) => {
    console.log('Extraction started:', config);
    setIsExtracting(true);
    setProgress(0);

    // Simulate extraction progress
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setIsExtracting(false);
          setOpen(false);
          return 0;
        }
        return p + 10;
      });
    }, 500);
  };

  return (
    <div className="p-8">
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Sparkles className="h-4 w-4" />
        Open Extraction Panel
      </Button>

      <ExtractionSheet
        {...props}
        open={open}
        onOpenChange={setOpen}
        onExtract={handleExtract}
        isExtracting={isExtracting}
        extractionProgress={progress}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <ExtractionSheetDemo totalMessages={500} />,
};

export const FewMessages: Story = {
  render: () => <ExtractionSheetDemo totalMessages={50} />,
  parameters: {
    docs: {
      description: {
        story: 'With a small number of messages, the preview shows lower confidence.',
      },
    },
  },
};

export const ManyMessages: Story = {
  render: () => <ExtractionSheetDemo totalMessages={5000} />,
  parameters: {
    docs: {
      description: {
        story: 'With many messages, cost and time estimates increase proportionally.',
      },
    },
  },
};

export const Extracting: Story = {
  args: {
    open: true,
    totalMessages: 500,
    isExtracting: true,
    extractionProgress: 45,
    onOpenChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the extraction in progress state with progress bar.',
      },
    },
  },
};

export const KeyboardShortcuts: Story = {
  render: () => <ExtractionSheetDemo totalMessages={500} />,
  parameters: {
    docs: {
      description: {
        story: `
## Keyboard Shortcuts
- **1-4**: Quick period selection
- **Ctrl/Cmd + Enter**: Start extraction
- **Escape**: Close sheet

Try pressing these keys when the sheet is open!
        `,
      },
    },
  },
};
