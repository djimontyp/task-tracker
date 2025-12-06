import { describe, test, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Settings, Bell } from 'lucide-react';
import { TooltipIconButton } from './index';

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('TooltipIconButton', () => {
  test('renders button with icon', () => {
    renderWithRouter(
      <TooltipIconButton
        icon={<Settings data-testid="settings-icon" className="h-5 w-5" />}
        label="Open settings"
        tooltip="Settings"
      />
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
  });

  test('shows tooltip on hover', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <TooltipIconButton
        icon={<Settings className="h-5 w-5" />}
        label="Open settings"
        tooltip="Settings tooltip"
      />
    );

    const button = screen.getByRole('button');
    await user.hover(button);

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveTextContent('Settings tooltip');
    });
  });

  test('calls onClick handler', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    renderWithRouter(
      <TooltipIconButton
        icon={<Bell className="h-5 w-5" />}
        label="Toggle notifications"
        tooltip="Notifications"
        onClick={handleClick}
      />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('has aria-label for accessibility', () => {
    renderWithRouter(
      <TooltipIconButton
        icon={<Settings className="h-5 w-5" />}
        label="Open settings"
        tooltip="Settings"
      />
    );

    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Open settings'
    );
  });

  test('renders as link when href is provided', () => {
    renderWithRouter(
      <TooltipIconButton
        icon={<Settings className="h-5 w-5" />}
        label="Go to settings"
        tooltip="Settings"
        href="/settings"
      />
    );

    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/settings');
    expect(link).toHaveAttribute('aria-label', 'Go to settings');
  });

  test('applies custom className', () => {
    renderWithRouter(
      <TooltipIconButton
        icon={<Settings className="h-5 w-5" />}
        label="Settings"
        tooltip="Settings"
        className="custom-class"
      />
    );

    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  test('button is disabled when disabled prop is true', () => {
    renderWithRouter(
      <TooltipIconButton
        icon={<Settings className="h-5 w-5" />}
        label="Settings"
        tooltip="Settings"
        disabled
      />
    );

    expect(screen.getByRole('button')).toBeDisabled();
  });

  test('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    renderWithRouter(
      <TooltipIconButton
        icon={<Settings className="h-5 w-5" />}
        label="Settings"
        tooltip="Settings"
        onClick={handleClick}
        disabled
      />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  test('has correct touch target size (44px)', () => {
    renderWithRouter(
      <TooltipIconButton
        icon={<Settings className="h-5 w-5" />}
        label="Settings"
        tooltip="Settings"
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-11', 'w-11');
  });

  test('has proper focus styles', () => {
    renderWithRouter(
      <TooltipIconButton
        icon={<Settings className="h-5 w-5" />}
        label="Settings"
        tooltip="Settings"
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('focus-visible:ring-2');
  });
});
