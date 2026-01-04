import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import {
  DataList,
  InlineDataList,
  KeyValueGrid,
  StatGrid,
} from './DataList';
import { TooltipProvider } from '@/shared/ui/tooltip';
import { Badge } from '@/shared/ui/badge';
import { Activity } from 'lucide-react';

// Store original ResizeObserver
const OriginalResizeObserver = window.ResizeObserver;

// Mock ResizeObserver as a class
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(_callback: ResizeObserverCallback) {}
}

beforeAll(() => {
  window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
});

afterAll(() => {
  window.ResizeObserver = OriginalResizeObserver;
});

const renderWithTooltip = (ui: React.ReactElement) => {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
};

describe('DataList', () => {
  describe('rendering', () => {
    it('renders all items', () => {
      renderWithTooltip(
        <DataList
          items={[
            { label: 'Name', value: 'John' },
            { label: 'Email', value: 'john@example.com' },
          ]}
        />
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('uses semantic dl/dt/dd elements', () => {
      const { container } = renderWithTooltip(
        <DataList
          items={[
            { label: 'Label', value: 'Value' },
          ]}
        />
      );

      expect(container.querySelector('dl')).toBeInTheDocument();
      expect(container.querySelector('dt')).toBeInTheDocument();
      expect(container.querySelector('dd')).toBeInTheDocument();
    });

    it('renders icons when provided', () => {
      renderWithTooltip(
        <DataList
          items={[
            {
              label: 'Status',
              value: 'Active',
              icon: <Activity data-testid="status-icon" />,
            },
          ]}
        />
      );

      expect(screen.getByTestId('status-icon')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
      renderWithTooltip(
        <DataList
          items={[
            {
              label: 'Temperature',
              value: '0.7',
              description: 'Controls randomness',
            },
          ]}
        />
      );

      expect(screen.getByText('Controls randomness')).toBeInTheDocument();
    });

    it('renders ReactNode values correctly', () => {
      renderWithTooltip(
        <DataList
          items={[
            {
              label: 'Status',
              value: <Badge>Active</Badge>,
            },
          ]}
        />
      );

      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  describe('columns', () => {
    it('applies single column class by default', () => {
      const { container } = renderWithTooltip(
        <DataList items={[{ label: 'L', value: 'V' }]} />
      );

      const dl = container.querySelector('dl');
      expect(dl).toHaveClass('grid-cols-1');
    });

    it('applies two column classes', () => {
      const { container } = renderWithTooltip(
        <DataList items={[{ label: 'L', value: 'V' }]} columns={2} />
      );

      const dl = container.querySelector('dl');
      expect(dl).toHaveClass('sm:grid-cols-2');
    });

    it('applies three column classes', () => {
      const { container } = renderWithTooltip(
        <DataList items={[{ label: 'L', value: 'V' }]} columns={3} />
      );

      const dl = container.querySelector('dl');
      expect(dl).toHaveClass('lg:grid-cols-3');
    });
  });

  describe('density', () => {
    it('applies compact density styles', () => {
      const { container } = renderWithTooltip(
        <DataList items={[{ label: 'L', value: 'V' }]} density="compact" />
      );

      const dl = container.querySelector('dl');
      expect(dl).toHaveClass('gap-2');
    });

    it('applies comfortable density styles', () => {
      const { container } = renderWithTooltip(
        <DataList items={[{ label: 'L', value: 'V' }]} density="comfortable" />
      );

      const dl = container.querySelector('dl');
      expect(dl).toHaveClass('gap-4');
    });

    it('applies spacious density styles', () => {
      const { container } = renderWithTooltip(
        <DataList items={[{ label: 'L', value: 'V' }]} density="spacious" />
      );

      const dl = container.querySelector('dl');
      expect(dl).toHaveClass('gap-6');
    });
  });

  describe('orientation', () => {
    it('renders vertical orientation by default', () => {
      renderWithTooltip(
        <DataList
          items={[{ label: 'Label', value: 'Value' }]}
          orientation="vertical"
        />
      );

      // In vertical, label and value are stacked
      expect(screen.getByText('Label')).toBeInTheDocument();
      expect(screen.getByText('Value')).toBeInTheDocument();
    });

    it('renders horizontal orientation', () => {
      renderWithTooltip(
        <DataList
          items={[{ label: 'Label', value: 'Value' }]}
          orientation="horizontal"
        />
      );

      // In horizontal, label and value are on same line
      expect(screen.getByText('Label')).toBeInTheDocument();
      expect(screen.getByText('Value')).toBeInTheDocument();
    });
  });

  describe('dividers', () => {
    it('adds border class when divided is true', () => {
      const { container } = renderWithTooltip(
        <DataList
          items={[
            { label: 'L1', value: 'V1' },
            { label: 'L2', value: 'V2' },
          ]}
          divided={true}
        />
      );

      // First item should have border, last should not
      const items = container.querySelectorAll('dl > div');
      expect(items[0]).toHaveClass('border-b');
    });
  });

  describe('variants', () => {
    it('applies muted variant styles', () => {
      const { container } = renderWithTooltip(
        <DataList items={[{ label: 'L', value: 'V' }]} variant="muted" />
      );

      const dl = container.querySelector('dl');
      expect(dl).toHaveClass('bg-muted/50');
    });

    it('applies card variant styles', () => {
      const { container } = renderWithTooltip(
        <DataList items={[{ label: 'L', value: 'V' }]} variant="card" />
      );

      const dl = container.querySelector('dl');
      expect(dl).toHaveClass('bg-card', 'border', 'shadow-sm');
    });
  });

  describe('colSpan', () => {
    it('applies col-span class for spanning items', () => {
      const { container } = renderWithTooltip(
        <DataList
          columns={2}
          items={[
            { label: 'Full Width', value: 'Value', colSpan: 2 },
          ]}
        />
      );

      const item = container.querySelector('dl > div');
      expect(item).toHaveClass('sm:col-span-2');
    });
  });
});

describe('InlineDataList', () => {
  it('renders label and value inline', () => {
    renderWithTooltip(
      <InlineDataList label="Status" value="Active" />
    );

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    renderWithTooltip(
      <InlineDataList
        label="Status"
        value="Active"
        icon={<Activity data-testid="icon" />}
      />
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = renderWithTooltip(
      <InlineDataList label="L" value="V" className="custom-class" />
    );

    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });
});

describe('KeyValueGrid', () => {
  it('renders data object as key-value pairs', () => {
    renderWithTooltip(
      <KeyValueGrid
        data={{
          Model: 'gpt-4o',
          Temperature: 0.7,
        }}
      />
    );

    expect(screen.getByText('Model')).toBeInTheDocument();
    expect(screen.getByText('gpt-4o')).toBeInTheDocument();
    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('0.7')).toBeInTheDocument();
  });

  it('respects column count', () => {
    const { container } = renderWithTooltip(
      <KeyValueGrid data={{ A: 1, B: 2 }} columns={3} />
    );

    const dl = container.querySelector('dl');
    expect(dl).toHaveClass('lg:grid-cols-3');
  });
});

describe('StatGrid', () => {
  it('renders stats correctly', () => {
    renderWithTooltip(
      <StatGrid
        stats={[
          { label: 'Total', value: '1,234' },
          { label: 'Active', value: '567' },
        ]}
      />
    );

    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('567')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    renderWithTooltip(
      <StatGrid
        stats={[
          { label: 'Messages', value: '1,234', description: '+100 today' },
        ]}
      />
    );

    expect(screen.getByText('+100 today')).toBeInTheDocument();
  });

  it('applies column count correctly', () => {
    const { container } = renderWithTooltip(
      <StatGrid stats={[{ label: 'L', value: 1 }]} columns={4} />
    );

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('sm:grid-cols-4');
  });
});

describe('accessibility', () => {
  it('uses semantic HTML for screen readers', () => {
    const { container } = renderWithTooltip(
      <DataList
        items={[
          { label: 'Name', value: 'John' },
        ]}
      />
    );

    // dl element is accessible as a description list
    const dl = container.querySelector('dl');
    expect(dl).toBeInTheDocument();

    // dt is the term
    const dt = container.querySelector('dt');
    expect(dt).toHaveTextContent('Name');

    // dd is the description
    const dd = container.querySelector('dd');
    expect(dd).toHaveTextContent('John');
  });
});
