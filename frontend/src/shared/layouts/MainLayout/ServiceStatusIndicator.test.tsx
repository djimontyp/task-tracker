import { describe, test, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ServiceStatusIndicator } from './ServiceStatusIndicator';

describe('ServiceStatusIndicator', () => {
  test('renders healthy state with correct icon', () => {
    render(<ServiceStatusIndicator status="healthy" />);

    const statusElement = screen.getByRole('status');
    expect(statusElement).toBeInTheDocument();
    // Icon should have semantic success color
    const icon = statusElement.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  test('renders warning state', () => {
    render(<ServiceStatusIndicator status="warning" />);

    const statusElement = screen.getByRole('status');
    expect(statusElement).toBeInTheDocument();
  });

  test('renders error state', () => {
    render(<ServiceStatusIndicator status="error" />);

    const statusElement = screen.getByRole('status');
    expect(statusElement).toBeInTheDocument();
  });

  test('shows tooltip content on hover', async () => {
    const user = userEvent.setup();
    render(<ServiceStatusIndicator status="healthy" />);

    const statusElement = screen.getByRole('status');
    await user.hover(statusElement);

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveTextContent('Connected');
    });
  });

  test('displays correct label for healthy status', () => {
    render(<ServiceStatusIndicator status="healthy" showLabel />);

    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  test('displays correct label for warning status', () => {
    render(<ServiceStatusIndicator status="warning" showLabel />);

    expect(screen.getByText('Reconnecting')).toBeInTheDocument();
  });

  test('displays correct label for error status', () => {
    render(<ServiceStatusIndicator status="error" showLabel />);

    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  test('hides label when showLabel is false', () => {
    render(<ServiceStatusIndicator status="healthy" showLabel={false} />);

    expect(screen.queryByText('Connected')).not.toBeInTheDocument();
  });

  test('applies custom className', () => {
    render(
      <ServiceStatusIndicator status="healthy" className="custom-class" />
    );

    const container = screen.getByRole('status');
    expect(container).toHaveClass('custom-class');
  });

  test('uses custom ariaLabel when provided', () => {
    render(
      <ServiceStatusIndicator status="healthy" ariaLabel="Custom status label" />
    );

    const container = screen.getByRole('status');
    expect(container).toHaveAttribute('aria-label', 'Custom status label');
  });

  test('has correct default aria-label for each status', () => {
    const { rerender } = render(<ServiceStatusIndicator status="healthy" />);
    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      'Connected'
    );

    rerender(<ServiceStatusIndicator status="warning" />);
    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      'Reconnecting'
    );

    rerender(<ServiceStatusIndicator status="error" />);
    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      'Disconnected'
    );
  });
});
