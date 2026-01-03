import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import {
  CardActions,
  IconButtonGroup,
  ResponsiveActions,
} from './CardActions';
import { Button } from '@/shared/ui/button';
import { TooltipProvider } from '@/shared/ui/tooltip';
import { Pencil, Trash2, Copy, Settings } from 'lucide-react';

const renderWithTooltip = (ui: React.ReactElement) => {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
};

describe('CardActions', () => {
  describe('rendering', () => {
    it('renders primary actions', () => {
      renderWithTooltip(
        <CardActions
          primary={<Button>Save</Button>}
        />
      );

      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });

    it('renders secondary actions', () => {
      renderWithTooltip(
        <CardActions
          primary={<Button>Primary</Button>}
          secondary={[
            <Button key="1">Secondary 1</Button>,
            <Button key="2">Secondary 2</Button>,
          ]}
        />
      );

      expect(screen.getByRole('button', { name: 'Primary' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Secondary 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Secondary 2' })).toBeInTheDocument();
    });

    it('renders dropdown menu when dropdownItems provided', () => {
      renderWithTooltip(
        <CardActions
          dropdownItems={[
            { label: 'Edit', onClick: vi.fn() },
            { label: 'Delete', onClick: vi.fn() },
          ]}
        />
      );

      expect(screen.getByRole('button', { name: 'More actions' })).toBeInTheDocument();
    });
  });

  describe('layout', () => {
    it('renders inline layout by default', () => {
      const { container } = renderWithTooltip(
        <CardActions
          primary={<Button>Action</Button>}
        />
      );

      // Inline layout uses flex-row
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('flex', 'items-center');
    });

    it('renders stacked layout when specified', () => {
      const { container } = renderWithTooltip(
        <CardActions
          layout="stacked"
          primary={<Button>Action</Button>}
        />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('flex-col');
    });
  });

  describe('alignment', () => {
    it('aligns to end by default', () => {
      const { container } = renderWithTooltip(
        <CardActions primary={<Button>Action</Button>} />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('justify-end');
    });

    it('aligns to start when specified', () => {
      const { container } = renderWithTooltip(
        <CardActions primary={<Button>Action</Button>} align="start" />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('justify-start');
    });

    it('aligns between when specified', () => {
      const { container } = renderWithTooltip(
        <CardActions primary={<Button>Action</Button>} align="between" />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('justify-between');
    });
  });

  describe('dropdown menu', () => {
    it('opens dropdown on click', async () => {
      const user = userEvent.setup();

      renderWithTooltip(
        <CardActions
          dropdownItems={[
            { label: 'Edit', onClick: vi.fn() },
            { label: 'Delete', onClick: vi.fn() },
          ]}
        />
      );

      await user.click(screen.getByRole('button', { name: 'More actions' }));

      expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
    });

    it('calls onClick when item clicked', async () => {
      const user = userEvent.setup();
      const handleEdit = vi.fn();

      renderWithTooltip(
        <CardActions
          dropdownItems={[
            { label: 'Edit', icon: Pencil, onClick: handleEdit },
          ]}
        />
      );

      await user.click(screen.getByRole('button', { name: 'More actions' }));
      await user.click(screen.getByRole('menuitem', { name: 'Edit' }));

      expect(handleEdit).toHaveBeenCalledTimes(1);
    });

    it('renders separator before item when separatorBefore is true', async () => {
      const user = userEvent.setup();

      renderWithTooltip(
        <CardActions
          dropdownItems={[
            { label: 'Edit', onClick: vi.fn() },
            { label: 'Delete', onClick: vi.fn(), separatorBefore: true },
          ]}
        />
      );

      await user.click(screen.getByRole('button', { name: 'More actions' }));

      // Separator should be present in the menu
      const menu = screen.getByRole('menu');
      expect(menu.querySelector('[role="separator"]')).toBeInTheDocument();
    });

    it('applies destructive variant styling', async () => {
      const user = userEvent.setup();

      renderWithTooltip(
        <CardActions
          dropdownItems={[
            { label: 'Delete', onClick: vi.fn(), variant: 'destructive' },
          ]}
        />
      );

      await user.click(screen.getByRole('button', { name: 'More actions' }));

      const deleteItem = screen.getByRole('menuitem', { name: 'Delete' });
      expect(deleteItem).toHaveClass('text-destructive');
    });

    it('disables item when disabled is true', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      renderWithTooltip(
        <CardActions
          dropdownItems={[
            { label: 'Edit', onClick: handleClick, disabled: true },
          ]}
        />
      );

      await user.click(screen.getByRole('button', { name: 'More actions' }));

      const editItem = screen.getByRole('menuitem', { name: 'Edit' });
      expect(editItem).toHaveAttribute('data-disabled');
    });

    it('uses custom dropdown label', () => {
      renderWithTooltip(
        <CardActions
          dropdownLabel="Custom label"
          dropdownItems={[{ label: 'Action', onClick: vi.fn() }]}
        />
      );

      expect(screen.getByRole('button', { name: 'Custom label' })).toBeInTheDocument();
    });
  });
});

describe('IconButtonGroup', () => {
  it('renders all icon buttons', () => {
    renderWithTooltip(
      <IconButtonGroup
        actions={[
          { icon: Pencil, label: 'Edit', onClick: vi.fn() },
          { icon: Copy, label: 'Copy', onClick: vi.fn() },
        ]}
      />
    );

    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
  });

  it('calls onClick when button clicked', async () => {
    const user = userEvent.setup();
    const handleEdit = vi.fn();

    renderWithTooltip(
      <IconButtonGroup
        actions={[
          { icon: Pencil, label: 'Edit', onClick: handleEdit },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(handleEdit).toHaveBeenCalledTimes(1);
  });

  it('applies size classes correctly', () => {
    const { rerender } = renderWithTooltip(
      <IconButtonGroup
        size="default"
        actions={[{ icon: Pencil, label: 'Edit', onClick: vi.fn() }]}
      />
    );

    let button = screen.getByRole('button', { name: 'Edit' });
    expect(button).toHaveClass('h-11', 'w-11');

    rerender(
      <TooltipProvider>
        <IconButtonGroup
          size="sm"
          actions={[{ icon: Pencil, label: 'Edit', onClick: vi.fn() }]}
        />
      </TooltipProvider>
    );

    button = screen.getByRole('button', { name: 'Edit' });
    expect(button).toHaveClass('h-9', 'w-9');
  });

  it('applies destructive styling', () => {
    renderWithTooltip(
      <IconButtonGroup
        actions={[
          { icon: Trash2, label: 'Delete', onClick: vi.fn(), variant: 'destructive' },
        ]}
      />
    );

    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button).toHaveClass('text-destructive');
  });

  it('disables button when disabled is true', () => {
    renderWithTooltip(
      <IconButtonGroup
        actions={[
          { icon: Pencil, label: 'Edit', onClick: vi.fn(), disabled: true },
        ]}
      />
    );

    const button = screen.getByRole('button', { name: 'Edit' });
    expect(button).toBeDisabled();
  });
});

describe('ResponsiveActions', () => {
  it('renders visible actions', () => {
    renderWithTooltip(
      <ResponsiveActions
        visible={[
          { icon: Pencil, label: 'Edit', onClick: vi.fn() },
        ]}
        collapsed={[]}
      />
    );

    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it('renders collapsed actions in dropdown on mobile viewport', () => {
    renderWithTooltip(
      <ResponsiveActions
        visible={[]}
        collapsed={[
          { label: 'Settings', icon: Settings, onClick: vi.fn() },
          { label: 'Delete', icon: Trash2, onClick: vi.fn() },
        ]}
        collapseAt="md"
      />
    );

    // Dropdown trigger should be visible (for mobile)
    const trigger = screen.getByRole('button', { name: 'More actions' });
    expect(trigger).toBeInTheDocument();
  });

  it('uses custom dropdown label', () => {
    renderWithTooltip(
      <ResponsiveActions
        visible={[]}
        collapsed={[{ label: 'Action', onClick: vi.fn() }]}
        dropdownLabel="Agent options"
      />
    );

    expect(screen.getByRole('button', { name: 'Agent options' })).toBeInTheDocument();
  });
});

describe('accessibility', () => {
  it('icon buttons have accessible names', () => {
    renderWithTooltip(
      <IconButtonGroup
        actions={[
          { icon: Pencil, label: 'Edit', onClick: vi.fn() },
          { icon: Trash2, label: 'Delete', onClick: vi.fn() },
        ]}
      />
    );

    expect(screen.getByRole('button', { name: 'Edit' })).toHaveAccessibleName('Edit');
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveAccessibleName('Delete');
  });

  it('dropdown trigger has accessible name', () => {
    renderWithTooltip(
      <CardActions
        dropdownItems={[{ label: 'Action', onClick: vi.fn() }]}
        dropdownLabel="More options"
      />
    );

    expect(screen.getByRole('button', { name: 'More options' })).toHaveAccessibleName('More options');
  });

  it('dropdown items are keyboard navigable', async () => {
    const user = userEvent.setup();
    const handleFirst = vi.fn();
    const handleSecond = vi.fn();

    renderWithTooltip(
      <CardActions
        dropdownItems={[
          { label: 'First', onClick: handleFirst },
          { label: 'Second', onClick: handleSecond },
        ]}
      />
    );

    // Open dropdown
    await user.click(screen.getByRole('button', { name: 'More actions' }));

    // Navigate with keyboard
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    // First item should be activated
    expect(handleFirst).toHaveBeenCalled();
  });
});
