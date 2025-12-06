import { describe, test, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ServiceStatusIndicator } from './ServiceStatusIndicator';

describe('ServiceStatusIndicator', () => {
  test('renders healthy state with correct classes', () => {
    render(<ServiceStatusIndicator status="healthy" />);

    const dot = screen.getByTestId('status-dot');
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveClass('bg-semantic-success');
    expect(dot).not.toHaveClass('animate-pulse');
  });

  test('renders warning state with animate-pulse', () => {
    render(<ServiceStatusIndicator status="warning" />);

    const dot = screen.getByTestId('status-dot');
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveClass('bg-semantic-warning');
    expect(dot).toHaveClass('animate-pulse');
  });

  test('renders error state with animate-pulse', () => {
    render(<ServiceStatusIndicator status="error" />);

    const dot = screen.getByTestId('status-dot');
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveClass('bg-destructive');
    expect(dot).toHaveClass('animate-pulse');
  });

  test('shows tooltip content on hover', async () => {
    const user = userEvent.setup();
    render(<ServiceStatusIndicator status="healthy" />);

    const statusElement = screen.getByRole('status');
    await user.hover(statusElement);

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveTextContent('Service healthy');
    });
  });

  test('displays correct label for healthy status', () => {
    render(<ServiceStatusIndicator status="healthy" showLabel />);

    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  test('displays correct label for warning status', () => {
    render(<ServiceStatusIndicator status="warning" showLabel />);

    expect(screen.getByText('Unstable')).toBeInTheDocument();
  });

  test('displays correct label for error status', () => {
    render(<ServiceStatusIndicator status="error" showLabel />);

    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  test('hides label when showLabel is false', () => {
    render(<ServiceStatusIndicator status="healthy" showLabel={false} />);

    expect(screen.queryByText('Online')).not.toBeInTheDocument();
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
      'Service healthy'
    );

    rerender(<ServiceStatusIndicator status="warning" />);
    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      'Service unstable'
    );

    rerender(<ServiceStatusIndicator status="error" />);
    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      'Service offline'
    );
  });
});
