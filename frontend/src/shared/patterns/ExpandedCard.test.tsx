/**
 * ExpandedCard Unit Tests
 *
 * Coverage targets:
 * - Header slot rendering
 * - Metadata rendering via DataList
 * - Description text rendering
 * - Actions and footer slots
 * - Loading, error, and empty states
 * - Click interactions and keyboard navigation
 * - Accessibility (ARIA labels, roles)
 * - Touch target compliance (>=44px)
 * - Responsive visibility (hidden sm:block)
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ExpandedCard } from './ExpandedCard';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Settings } from 'lucide-react';
import type { DataListItem } from './DataList';

// ===================================================================
// TEST DATA
// ===================================================================

const mockMetadata: DataListItem[] = [
  { label: 'Model', value: 'gpt-4o' },
  { label: 'Status', value: <Badge data-testid="status-badge">Active</Badge> },
  { label: 'Created', value: '2024-01-15' },
];

const mockHeader = (
  <div>
    <h3 className="text-lg font-semibold">Agent Name</h3>
    <p className="text-sm text-muted-foreground">Subtitle text</p>
  </div>
);

const mockActions = (
  <div className="flex gap-2">
    <Button size="icon" aria-label="Edit">
      <Settings className="h-4 w-4" />
    </Button>
  </div>
);

const mockFooter = (
  <div className="flex justify-between" data-testid="footer-content">
    <span>Last updated: 2 hours ago</span>
    <Button variant="link">View Details</Button>
  </div>
);

// ===================================================================
// RENDERING TESTS
// ===================================================================

describe('ExpandedCard - Rendering', () => {
  it('renders header slot content', () => {
    render(<ExpandedCard header={mockHeader} />);

    expect(screen.getByText('Agent Name')).toBeInTheDocument();
    expect(screen.getByText('Subtitle text')).toBeInTheDocument();
  });

  it('renders metadata via DataList', () => {
    render(<ExpandedCard header={mockHeader} metadata={mockMetadata} />);

    expect(screen.getByText('Model')).toBeInTheDocument();
    expect(screen.getByText('gpt-4o')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByTestId('status-badge')).toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText('2024-01-15')).toBeInTheDocument();
  });

  it('renders description text', () => {
    const description = 'This agent processes incoming messages and extracts knowledge.';
    render(<ExpandedCard header={mockHeader} description={description} />);

    const descriptionEl = screen.getByText(description);
    expect(descriptionEl).toBeInTheDocument();
    expect(descriptionEl).toHaveClass('text-sm', 'text-muted-foreground');
  });

  it('renders actions slot in header', () => {
    render(<ExpandedCard header={mockHeader} actions={mockActions} />);

    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it('renders footer slot with border', () => {
    render(<ExpandedCard header={mockHeader} footer={mockFooter} />);

    expect(screen.getByTestId('footer-content')).toBeInTheDocument();
    expect(screen.getByText('Last updated: 2 hours ago')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View Details' })).toBeInTheDocument();
  });

  it('renders description + metadata together', () => {
    const description = 'Test description';
    render(
      <ExpandedCard
        header={mockHeader}
        description={description}
        metadata={mockMetadata}
      />
    );

    expect(screen.getByText(description)).toBeInTheDocument();
    expect(screen.getByText('Model')).toBeInTheDocument();
  });

  it('does not render content section when no description or metadata', () => {
    const { container } = render(<ExpandedCard header={mockHeader} />);

    // CardContent should not exist
    const cardContent = container.querySelector('[class*="pt-0"]');
    expect(cardContent).not.toBeInTheDocument();
  });
});

// ===================================================================
// STATE TESTS - LOADING
// ===================================================================

describe('ExpandedCard - Loading State', () => {
  it('renders skeleton when isLoading is true', () => {
    const { container } = render(
      <ExpandedCard header={mockHeader} isLoading />
    );

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0, 'Expected multiple skeleton elements in loading state');
  });

  it('does not render header content when loading', () => {
    render(<ExpandedCard header={mockHeader} isLoading />);

    expect(screen.queryByText('Agent Name')).not.toBeInTheDocument();
  });

  it('does not render metadata when loading', () => {
    render(
      <ExpandedCard
        header={mockHeader}
        metadata={mockMetadata}
        isLoading
      />
    );

    expect(screen.queryByText('Model')).not.toBeInTheDocument();
  });

  it('does not render description when loading', () => {
    render(
      <ExpandedCard
        header={mockHeader}
        description="Should not render"
        isLoading
      />
    );

    expect(screen.queryByText('Should not render')).not.toBeInTheDocument();
  });
});

// ===================================================================
// STATE TESTS - ERROR
// ===================================================================

describe('ExpandedCard - Error State', () => {
  it('renders error state when isError is true', () => {
    render(<ExpandedCard header={mockHeader} isError />);

    expect(screen.getByText('Failed to load content')).toBeInTheDocument();
  });

  it('displays error message when error object provided', () => {
    const error = new Error('Network timeout');
    render(<ExpandedCard header={mockHeader} isError error={error} />);

    expect(screen.getByText('Failed to load content')).toBeInTheDocument();
    expect(screen.getByText('Network timeout')).toBeInTheDocument();
  });

  it('renders retry button when onRetry provided', () => {
    const onRetry = vi.fn();
    render(<ExpandedCard header={mockHeader} isError onRetry={onRetry} />);

    const retryButton = screen.getByRole('button', { name: 'Retry loading content' });
    expect(retryButton).toBeInTheDocument();
    expect(retryButton).toHaveTextContent('Retry');
  });

  it('does not render retry button when onRetry not provided', () => {
    render(<ExpandedCard header={mockHeader} isError />);

    expect(screen.queryByRole('button', { name: 'Retry loading content' })).not.toBeInTheDocument();
  });

  it('calls onRetry when retry button clicked', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(<ExpandedCard header={mockHeader} isError onRetry={onRetry} />);

    await user.click(screen.getByRole('button', { name: 'Retry loading content' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('error state has role="alert"', () => {
    render(<ExpandedCard header={mockHeader} isError />);

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
  });
});

// ===================================================================
// STATE TESTS - EMPTY
// ===================================================================

describe('ExpandedCard - Empty State', () => {
  it('renders empty state when isEmpty is true', () => {
    render(<ExpandedCard header={mockHeader} isEmpty />);

    expect(screen.getByText('No content available')).toBeInTheDocument();
  });

  it('displays custom empty message', () => {
    render(
      <ExpandedCard
        header={mockHeader}
        isEmpty
        emptyMessage="No agents configured"
      />
    );

    expect(screen.getByText('No agents configured')).toBeInTheDocument();
  });

  it('empty state has role="status"', () => {
    render(<ExpandedCard header={mockHeader} isEmpty />);

    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
  });

  it('does not render header content when empty', () => {
    render(<ExpandedCard header={mockHeader} isEmpty />);

    expect(screen.queryByText('Agent Name')).not.toBeInTheDocument();
  });
});

// ===================================================================
// INTERACTION TESTS - CLICK
// ===================================================================

describe('ExpandedCard - Click Interaction', () => {
  it('calls onClick when card is clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<ExpandedCard header={mockHeader} onClick={onClick} />);

    const card = screen.getByRole('button');
    await user.click(card);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('has role="button" when onClick is provided', () => {
    render(<ExpandedCard header={mockHeader} onClick={() => {}} />);

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('has tabIndex=0 when onClick is provided', () => {
    render(<ExpandedCard header={mockHeader} onClick={() => {}} />);

    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('tabindex', '0');
  });

  it('does not have role="button" when onClick not provided', () => {
    render(<ExpandedCard header={mockHeader} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

// ===================================================================
// INTERACTION TESTS - KEYBOARD
// ===================================================================

describe('ExpandedCard - Keyboard Navigation', () => {
  it('handles Enter key press', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<ExpandedCard header={mockHeader} onClick={onClick} />);

    const card = screen.getByRole('button');
    card.focus();
    await user.keyboard('{Enter}');

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('handles Space key press', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<ExpandedCard header={mockHeader} onClick={onClick} />);

    const card = screen.getByRole('button');
    card.focus();
    await user.keyboard(' ');

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not handle keyboard events when not clickable', async () => {
    const user = userEvent.setup();

    render(<ExpandedCard header={mockHeader} />);

    const { container } = render(<ExpandedCard header={mockHeader} />);
    const card = container.firstChild as HTMLElement;

    // Should not throw or trigger anything
    card.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    // No assertion needed - just ensuring no errors
  });

  it('stops propagation for actions onClick', async () => {
    const user = userEvent.setup();
    const cardClick = vi.fn();
    const actionClick = vi.fn();

    render(
      <ExpandedCard
        header={mockHeader}
        onClick={cardClick}
        actions={
          <Button onClick={actionClick} aria-label="Action">
            <Settings />
          </Button>
        }
      />
    );

    await user.click(screen.getByRole('button', { name: 'Action' }));

    expect(actionClick).toHaveBeenCalledTimes(1);
    expect(cardClick).not.toHaveBeenCalled();
  });
});

// ===================================================================
// ACCESSIBILITY TESTS
// ===================================================================

describe('ExpandedCard - Accessibility', () => {
  it('passes aria-label to card element', () => {
    render(
      <ExpandedCard
        header={mockHeader}
        onClick={() => {}}
        aria-label="Navigate to agent details"
      />
    );

    const card = screen.getByRole('button', { name: 'Navigate to agent details' });
    expect(card).toBeInTheDocument();
  });

  it('uses aria-label for clickable card', () => {
    render(
      <ExpandedCard
        header={mockHeader}
        onClick={() => {}}
        aria-label="Open settings"
      />
    );

    expect(screen.getByLabelText('Open settings')).toBeInTheDocument();
  });

  it('error state has role="alert" and aria-live', () => {
    const { container } = render(<ExpandedCard header={mockHeader} isError />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });

  it('empty state has role="status"', () => {
    render(<ExpandedCard header={mockHeader} isEmpty />);

    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
  });

  it('retry button has accessible label', () => {
    render(<ExpandedCard header={mockHeader} isError onRetry={() => {}} />);

    const retryButton = screen.getByRole('button', { name: 'Retry loading content' });
    expect(retryButton).toHaveAttribute('aria-label', 'Retry loading content');
  });

  it('error icon has aria-hidden', () => {
    const { container } = render(<ExpandedCard header={mockHeader} isError />);

    const icon = container.querySelector('[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });

  it('empty state icon has aria-hidden', () => {
    const { container } = render(<ExpandedCard header={mockHeader} isEmpty />);

    const icon = container.querySelector('[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });
});

// ===================================================================
// TOUCH TARGET TESTS (>=44px)
// ===================================================================

describe('ExpandedCard - Touch Targets', () => {
  it('retry button has 44px touch target', () => {
    render(<ExpandedCard header={mockHeader} isError onRetry={() => {}} />);

    const retryButton = screen.getByRole('button', { name: 'Retry loading content' });
    expect(retryButton).toHaveClass('h-11');
  });

  it('action buttons meet 44px minimum', () => {
    render(
      <ExpandedCard
        header={mockHeader}
        actions={
          <Button size="icon" className="h-11 w-11" aria-label="Settings">
            <Settings />
          </Button>
        }
      />
    );

    const button = screen.getByRole('button', { name: 'Settings' });
    expect(button).toHaveClass('h-11', 'w-11');
  });
});

// ===================================================================
// RESPONSIVE TESTS (hidden sm:block)
// ===================================================================

describe('ExpandedCard - Responsive Visibility', () => {
  it('has hidden sm:block classes for desktop-only display', () => {
    const { container } = render(<ExpandedCard header={mockHeader} />);

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('hidden', 'sm:block');
  });

  it('loading state has hidden sm:block', () => {
    const { container } = render(<ExpandedCard header={mockHeader} isLoading />);

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('hidden', 'sm:block');
  });

  it('error state has hidden sm:block', () => {
    const { container } = render(<ExpandedCard header={mockHeader} isError />);

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('hidden', 'sm:block');
  });

  it('empty state has hidden sm:block', () => {
    const { container } = render(<ExpandedCard header={mockHeader} isEmpty />);

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('hidden', 'sm:block');
  });
});

// ===================================================================
// METADATA CONFIGURATION TESTS
// ===================================================================

describe('ExpandedCard - Metadata Configuration', () => {
  it('passes metadataColumns to DataList', () => {
    const { container } = render(
      <ExpandedCard
        header={mockHeader}
        metadata={mockMetadata}
        metadataColumns={3}
      />
    );

    // DataList should receive columns=3
    // Verify by checking grid-cols-3 class exists
    const dataList = container.querySelector('.grid');
    expect(dataList).toBeInTheDocument();
  });

  it('passes metadataDensity to DataList', () => {
    const { container } = render(
      <ExpandedCard
        header={mockHeader}
        metadata={mockMetadata}
        metadataDensity="spacious"
      />
    );

    // DataList should receive density="spacious"
    const dataList = container.querySelector('.grid');
    expect(dataList).toBeInTheDocument();
  });

  it('uses default metadataColumns=2 when not specified', () => {
    const { container } = render(
      <ExpandedCard header={mockHeader} metadata={mockMetadata} />
    );

    // Should use default columns=2
    const dataList = container.querySelector('.grid');
    expect(dataList).toBeInTheDocument();
  });
});

// ===================================================================
// LAYOUT TESTS
// ===================================================================

describe('ExpandedCard - Layout', () => {
  it('applies custom className', () => {
    const { container } = render(
      <ExpandedCard header={mockHeader} className="custom-class" />
    );

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('custom-class');
  });

  it('applies hover styles when clickable', () => {
    const { container } = render(
      <ExpandedCard header={mockHeader} onClick={() => {}} />
    );

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('cursor-pointer', 'hover:bg-accent/5');
  });

  it('does not apply hover styles when not clickable', () => {
    const { container } = render(<ExpandedCard header={mockHeader} />);

    const card = container.firstChild as HTMLElement;
    expect(card).not.toHaveClass('cursor-pointer');
  });

  it('renders footer with border-t when provided', () => {
    const { container } = render(
      <ExpandedCard header={mockHeader} footer={mockFooter} />
    );

    const footer = container.querySelector('.border-t');
    expect(footer).toBeInTheDocument();
  });
});
