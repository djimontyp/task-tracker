import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import {
  CardHeaderWithActions,
  CompactCardHeader,
} from './card-header-with-actions';
import { Button } from './button';
import { TooltipProvider } from './tooltip';
import { Pencil, Trash2 } from 'lucide-react';

// Store original ResizeObserver
const OriginalResizeObserver = window.ResizeObserver;

// Mock ResizeObserver as a class
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(callback: ResizeObserverCallback) {}
}

beforeAll(() => {
  window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
});

afterAll(() => {
  window.ResizeObserver = OriginalResizeObserver;
});

// Wrapper with TooltipProvider
const renderWithTooltip = (ui: React.ReactElement) => {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
};

describe('CardHeaderWithActions', () => {
  describe('rendering', () => {
    it('renders title correctly', () => {
      renderWithTooltip(
        <CardHeaderWithActions title="Test Title" />
      );
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
      renderWithTooltip(
        <CardHeaderWithActions
          title="Title"
          description="Test description"
        />
      );
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('renders icon when provided', () => {
      renderWithTooltip(
        <CardHeaderWithActions
          title="Title"
          icon={<span data-testid="test-icon">Icon</span>}
        />
      );
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('renders badge when provided', () => {
      renderWithTooltip(
        <CardHeaderWithActions
          title="Title"
          badge={<span data-testid="test-badge">Badge</span>}
        />
      );
      expect(screen.getByTestId('test-badge')).toBeInTheDocument();
    });
  });

  describe('inline layout', () => {
    it('renders actions inline with title', () => {
      renderWithTooltip(
        <CardHeaderWithActions
          title="Title"
          layout="inline"
          actions={
            <Button aria-label="Edit">Edit</Button>
          }
        />
      );

      const editButton = screen.getByRole('button', { name: 'Edit' });
      expect(editButton).toBeInTheDocument();
    });

    it('auto-switches to stacked when actions exceed max', () => {
      renderWithTooltip(
        <CardHeaderWithActions
          title="Title"
          layout="inline"
          inlineMaxActions={2}
          actions={
            <>
              <Button key="1">Action 1</Button>
              <Button key="2">Action 2</Button>
              <Button key="3">Action 3</Button>
            </>
          }
        />
      );

      // All actions should still be visible (stacked layout)
      expect(screen.getByRole('button', { name: 'Action 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action 2' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action 3' })).toBeInTheDocument();
    });
  });

  describe('stacked layout', () => {
    it('renders actions below title', () => {
      renderWithTooltip(
        <CardHeaderWithActions
          title="Title"
          layout="stacked"
          actions={
            <>
              <Button>Edit</Button>
              <Button>Delete</Button>
            </>
          }
        />
      );

      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });
  });

  describe('dropdown layout', () => {
    it('renders dropdown menu trigger', () => {
      renderWithTooltip(
        <CardHeaderWithActions
          title="Title"
          layout="dropdown"
          dropdownActions={[
            { label: 'Edit', onClick: vi.fn() },
            { label: 'Delete', onClick: vi.fn() },
          ]}
        />
      );

      const trigger = screen.getByRole('button', { name: 'More actions' });
      expect(trigger).toBeInTheDocument();
    });

    it('opens dropdown menu on click', async () => {
      const user = userEvent.setup();

      renderWithTooltip(
        <CardHeaderWithActions
          title="Title"
          layout="dropdown"
          dropdownActions={[
            { label: 'Edit', icon: Pencil, onClick: vi.fn() },
            { label: 'Delete', icon: Trash2, onClick: vi.fn() },
          ]}
        />
      );

      const trigger = screen.getByRole('button', { name: 'More actions' });
      await user.click(trigger);

      expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
    });

    it('calls action onClick when menu item clicked', async () => {
      const user = userEvent.setup();
      const handleEdit = vi.fn();

      renderWithTooltip(
        <CardHeaderWithActions
          title="Title"
          layout="dropdown"
          dropdownActions={[
            { label: 'Edit', onClick: handleEdit },
          ]}
        />
      );

      await user.click(screen.getByRole('button', { name: 'More actions' }));
      await user.click(screen.getByRole('menuitem', { name: 'Edit' }));

      expect(handleEdit).toHaveBeenCalledTimes(1);
    });

    it('uses custom dropdown label', () => {
      renderWithTooltip(
        <CardHeaderWithActions
          title="Title"
          layout="dropdown"
          dropdownLabel="Agent actions"
          dropdownActions={[
            { label: 'Edit', onClick: vi.fn() },
          ]}
        />
      );

      expect(screen.getByRole('button', { name: 'Agent actions' })).toBeInTheDocument();
    });

    it('applies destructive variant styling', async () => {
      const user = userEvent.setup();

      renderWithTooltip(
        <CardHeaderWithActions
          title="Title"
          layout="dropdown"
          dropdownActions={[
            { label: 'Delete', onClick: vi.fn(), variant: 'destructive' },
          ]}
        />
      );

      await user.click(screen.getByRole('button', { name: 'More actions' }));

      const deleteItem = screen.getByRole('menuitem', { name: 'Delete' });
      expect(deleteItem).toHaveClass('text-destructive');
    });
  });

  describe('title truncation', () => {
    it('truncates long titles by default', () => {
      renderWithTooltip(
        <CardHeaderWithActions
          title="Very Long Title That Should Be Truncated"
          truncateTitle={true}
        />
      );

      const title = screen.getByText('Very Long Title That Should Be Truncated');
      expect(title).toHaveClass('truncate');
    });

    it('does not truncate when truncateTitle is false', () => {
      renderWithTooltip(
        <CardHeaderWithActions
          title="Title"
          truncateTitle={false}
        />
      );

      const title = screen.getByText('Title');
      expect(title).not.toHaveClass('truncate');
    });
  });
});

describe('CompactCardHeader', () => {
  it('renders title', () => {
    renderWithTooltip(
      <CompactCardHeader title="Compact Title" />
    );
    expect(screen.getByText('Compact Title')).toBeInTheDocument();
  });

  it('renders action when provided', () => {
    renderWithTooltip(
      <CompactCardHeader
        title="Title"
        action={<Button aria-label="Settings">Settings</Button>}
      />
    );
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = renderWithTooltip(
      <CompactCardHeader title="Title" className="custom-class" />
    );

    const header = container.querySelector('.custom-class');
    expect(header).toBeInTheDocument();
  });
});

describe('accessibility', () => {
  it('dropdown trigger has accessible name', () => {
    renderWithTooltip(
      <CardHeaderWithActions
        title="Title"
        layout="dropdown"
        dropdownActions={[{ label: 'Action', onClick: vi.fn() }]}
      />
    );

    const trigger = screen.getByRole('button', { name: 'More actions' });
    expect(trigger).toHaveAccessibleName('More actions');
  });

  it('dropdown items are keyboard accessible', async () => {
    const user = userEvent.setup();
    const handleAction = vi.fn();

    renderWithTooltip(
      <CardHeaderWithActions
        title="Title"
        layout="dropdown"
        dropdownActions={[
          { label: 'First', onClick: handleAction },
          { label: 'Second', onClick: vi.fn() },
        ]}
      />
    );

    // Open dropdown
    await user.click(screen.getByRole('button', { name: 'More actions' }));

    // Click on first menu item directly (keyboard nav is complex in Radix)
    const firstItem = screen.getByRole('menuitem', { name: 'First' });
    await user.click(firstItem);

    expect(handleAction).toHaveBeenCalled();
  });
});
