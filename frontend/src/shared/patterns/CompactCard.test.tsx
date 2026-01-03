/**
 * CompactCard Unit Tests
 *
 * Coverage targets:
 * - Title rendering with TruncatedText
 * - Badge display
 * - Primary action functionality
 * - Secondary actions (inline and overflow)
 * - Touch target compliance (>=44px)
 * - Responsive visibility (sm:hidden)
 * - Loading, error, and empty states
 * - Keyboard navigation for clickable cards
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CompactCard } from './CompactCard';
import { Badge } from '@/shared/ui/badge';
import { Pencil, Copy, Settings, Trash2, TestTube2 } from 'lucide-react';
import { TooltipProvider } from '@/shared/ui/tooltip';

// ===================================================================
// TEST UTILITIES
// ===================================================================

const renderWithProviders = (ui: React.ReactNode) => {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
};

const mockActions = {
  primary: {
    label: 'Edit',
    icon: <Pencil className="h-4 w-4" data-testid="edit-icon" />,
    onClick: vi.fn(),
  },
  secondary: [
    {
      label: 'Copy',
      icon: <Copy className="h-4 w-4" data-testid="copy-icon" />,
      onClick: vi.fn(),
    },
    {
      label: 'Settings',
      icon: <Settings className="h-4 w-4" data-testid="settings-icon" />,
      onClick: vi.fn(),
    },
    {
      label: 'Test',
      icon: <TestTube2 className="h-4 w-4" data-testid="test-icon" />,
      onClick: vi.fn(),
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" data-testid="delete-icon" />,
      onClick: vi.fn(),
      variant: 'destructive' as const,
    },
  ],
};

// ===================================================================
// TITLE TESTS
// ===================================================================

describe('CompactCard - Title', () => {
  it('renders title text', () => {
    renderWithProviders(<CompactCard title="Test Title" />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders title as h3 element', () => {
    renderWithProviders(<CompactCard title="Heading Title" />);

    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Heading Title');
  });

  it('truncates long titles', () => {
    const longTitle = 'This is a very long title that should be truncated on mobile screens';
    renderWithProviders(<CompactCard title={longTitle} />);

    const titleElement = screen.getByText(longTitle);
    expect(titleElement).toHaveClass('truncate');
  });
});

// ===================================================================
// BADGE TESTS
// ===================================================================

describe('CompactCard - Badge', () => {
  it('renders badge when provided', () => {
    renderWithProviders(
      <CompactCard
        title="With Badge"
        badge={<Badge data-testid="status-badge">Active</Badge>}
      />
    );

    expect(screen.getByTestId('status-badge')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('does not render badge when not provided', () => {
    renderWithProviders(<CompactCard title="No Badge" />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

// ===================================================================
// CONTENT TESTS
// ===================================================================

describe('CompactCard - Content', () => {
  it('renders content when provided', () => {
    renderWithProviders(
      <CompactCard
        title="With Content"
        content={<p data-testid="card-content">Description text</p>}
      />
    );

    expect(screen.getByTestId('card-content')).toBeInTheDocument();
    expect(screen.getByText('Description text')).toBeInTheDocument();
  });

  it('does not render content area when not provided', () => {
    const { container } = renderWithProviders(<CompactCard title="No Content" />);

    // Content area should not exist (only header with title)
    const contentDivs = container.querySelectorAll('.mt-2');
    expect(contentDivs.length).toBe(0);
  });
});

// ===================================================================
// PRIMARY ACTION TESTS
// ===================================================================

describe('CompactCard - Primary Action', () => {
  it('renders primary action button', () => {
    renderWithProviders(
      <CompactCard title="With Action" primaryAction={mockActions.primary} />
    );

    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it('calls onClick when primary action is clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    renderWithProviders(
      <CompactCard
        title="With Action"
        primaryAction={{ ...mockActions.primary, onClick }}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('stops propagation when action is clicked on clickable card', async () => {
    const user = userEvent.setup();
    const cardClick = vi.fn();
    const actionClick = vi.fn();

    renderWithProviders(
      <CompactCard
        title="Clickable"
        onClick={cardClick}
        primaryAction={{ ...mockActions.primary, onClick: actionClick }}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(actionClick).toHaveBeenCalledTimes(1);
    expect(cardClick).not.toHaveBeenCalled();
  });

  it('renders disabled action button', () => {
    renderWithProviders(
      <CompactCard
        title="Disabled Action"
        primaryAction={{ ...mockActions.primary, disabled: true }}
      />
    );

    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled();
  });
});

// ===================================================================
// SECONDARY ACTIONS TESTS
// ===================================================================

describe('CompactCard - Secondary Actions', () => {
  it('renders inline secondary actions when <= 2', () => {
    const twoActions = mockActions.secondary.slice(0, 2);

    renderWithProviders(
      <CompactCard
        title="Two Actions"
        primaryAction={mockActions.primary}
        secondaryActions={twoActions}
      />
    );

    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
  });

  it('renders overflow menu when > 2 secondary actions', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <CompactCard
        title="Many Actions"
        primaryAction={mockActions.primary}
        secondaryActions={mockActions.secondary}
      />
    );

    // Primary action should be visible
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();

    // Overflow menu trigger should be visible
    const moreButton = screen.getByRole('button', { name: 'More actions' });
    expect(moreButton).toBeInTheDocument();

    // Click overflow menu
    await user.click(moreButton);

    // Menu items should be visible
    expect(screen.getByRole('menuitem', { name: /Copy/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Settings/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Test/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Delete/i })).toBeInTheDocument();
  });

  it('calls onClick when overflow menu item is clicked', async () => {
    const user = userEvent.setup();
    const copyClick = vi.fn();

    renderWithProviders(
      <CompactCard
        title="Test Overflow"
        primaryAction={mockActions.primary}
        secondaryActions={[
          { ...mockActions.secondary[0], onClick: copyClick },
          mockActions.secondary[1],
          mockActions.secondary[2],
        ]}
      />
    );

    // Open overflow menu
    await user.click(screen.getByRole('button', { name: 'More actions' }));

    // Click Copy menu item
    await user.click(screen.getByRole('menuitem', { name: /Copy/i }));

    expect(copyClick).toHaveBeenCalledTimes(1);
  });

  it('renders destructive action with correct styling', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <CompactCard
        title="Destructive"
        primaryAction={mockActions.primary}
        secondaryActions={mockActions.secondary}
      />
    );

    await user.click(screen.getByRole('button', { name: 'More actions' }));

    const deleteItem = screen.getByRole('menuitem', { name: /Delete/i });
    expect(deleteItem).toHaveClass('text-destructive');
  });
});

// ===================================================================
// TOUCH TARGET TESTS (>=44px)
// ===================================================================

describe('CompactCard - Touch Targets', () => {
  it('primary action button has 44px touch target', () => {
    renderWithProviders(
      <CompactCard title="Touch Target" primaryAction={mockActions.primary} />
    );

    const button = screen.getByRole('button', { name: 'Edit' });
    expect(button).toHaveClass('h-11', 'w-11');
  });

  it('overflow menu button has 44px touch target', () => {
    renderWithProviders(
      <CompactCard
        title="Overflow Target"
        primaryAction={mockActions.primary}
        secondaryActions={mockActions.secondary}
      />
    );

    const moreButton = screen.getByRole('button', { name: 'More actions' });
    expect(moreButton).toHaveClass('h-11', 'w-11');
  });

  it('retry button in error state has 44px touch target', () => {
    renderWithProviders(
      <CompactCard
        title="Error"
        isError
        error={new Error('Test error')}
        onRetry={() => {}}
      />
    );

    const retryButton = screen.getByRole('button', { name: 'Retry' });
    expect(retryButton).toHaveClass('h-11', 'w-11');
  });
});

// ===================================================================
// RESPONSIVE TESTS (sm:hidden)
// ===================================================================

describe('CompactCard - Responsive', () => {
  it('has sm:hidden class for mobile-only visibility', () => {
    const { container } = renderWithProviders(<CompactCard title="Mobile Only" />);

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('sm:hidden');
  });

  it('loading state has sm:hidden class', () => {
    const { container } = renderWithProviders(
      <CompactCard title="Loading" isLoading />
    );

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('sm:hidden');
  });

  it('error state has sm:hidden class', () => {
    const { container } = renderWithProviders(
      <CompactCard title="Error" isError />
    );

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('sm:hidden');
  });

  it('empty state has sm:hidden class', () => {
    const { container } = renderWithProviders(
      <CompactCard title="Empty" isEmpty />
    );

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('sm:hidden');
  });
});

// ===================================================================
// STATE TESTS
// ===================================================================

describe('CompactCard - States', () => {
  describe('Loading State', () => {
    it('renders skeleton when isLoading is true', () => {
      const { container } = renderWithProviders(
        <CompactCard title="Loading" isLoading />
      );

      // Should have skeleton elements
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('does not render title when loading', () => {
      renderWithProviders(<CompactCard title="Hidden Title" isLoading />);

      expect(screen.queryByText('Hidden Title')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('renders error state when isError is true', () => {
      renderWithProviders(<CompactCard title="Error" isError />);

      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });

    it('displays error message when error is provided', () => {
      renderWithProviders(
        <CompactCard
          title="Error"
          isError
          error={new Error('Network error')}
        />
      );

      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('renders retry button when onRetry is provided', () => {
      const onRetry = vi.fn();

      renderWithProviders(
        <CompactCard title="Error" isError onRetry={onRetry} />
      );

      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();

      renderWithProviders(
        <CompactCard title="Error" isError onRetry={onRetry} />
      );

      await user.click(screen.getByRole('button', { name: 'Retry' }));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Empty State', () => {
    it('renders empty state when isEmpty is true', () => {
      renderWithProviders(<CompactCard title="Empty" isEmpty />);

      expect(screen.getByText('No content')).toBeInTheDocument();
    });

    it('displays custom empty message', () => {
      renderWithProviders(
        <CompactCard
          title="Empty"
          isEmpty
          emptyMessage="No agents configured"
        />
      );

      expect(screen.getByText('No agents configured')).toBeInTheDocument();
    });
  });
});

// ===================================================================
// CLICKABLE CARD TESTS
// ===================================================================

describe('CompactCard - Clickable', () => {
  it('calls onClick when card is clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    renderWithProviders(<CompactCard title="Clickable" onClick={onClick} />);

    await user.click(screen.getByRole('button', { name: 'Clickable' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('has button role when onClick is provided', () => {
    renderWithProviders(
      <CompactCard title="Clickable" onClick={() => {}} />
    );

    expect(screen.getByRole('button', { name: 'Clickable' })).toBeInTheDocument();
  });

  it('has tabIndex 0 when onClick is provided', () => {
    renderWithProviders(
      <CompactCard title="Clickable" onClick={() => {}} />
    );

    const card = screen.getByRole('button', { name: 'Clickable' });
    expect(card).toHaveAttribute('tabindex', '0');
  });

  it('handles Enter key press', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    renderWithProviders(<CompactCard title="Clickable" onClick={onClick} />);

    const card = screen.getByRole('button', { name: 'Clickable' });
    card.focus();
    await user.keyboard('{Enter}');

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('handles Space key press', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    renderWithProviders(<CompactCard title="Clickable" onClick={onClick} />);

    const card = screen.getByRole('button', { name: 'Clickable' });
    card.focus();
    await user.keyboard(' ');

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('uses custom aria-label when provided', () => {
    renderWithProviders(
      <CompactCard
        title="Clickable"
        onClick={() => {}}
        aria-label="Navigate to topic"
      />
    );

    expect(
      screen.getByRole('button', { name: 'Navigate to topic' })
    ).toBeInTheDocument();
  });

  it('has hover styling class when clickable', () => {
    const { container } = renderWithProviders(
      <CompactCard title="Clickable" onClick={() => {}} />
    );

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('cursor-pointer');
    expect(card).toHaveClass('hover:bg-accent/10');
  });
});

// ===================================================================
// ACCESSIBILITY TESTS
// ===================================================================

describe('CompactCard - Accessibility', () => {
  it('action buttons have aria-label', () => {
    renderWithProviders(
      <CompactCard title="A11y" primaryAction={mockActions.primary} />
    );

    expect(screen.getByRole('button', { name: 'Edit' })).toHaveAttribute(
      'aria-label',
      'Edit'
    );
  });

  it('overflow menu trigger has aria-label', () => {
    renderWithProviders(
      <CompactCard
        title="A11y"
        primaryAction={mockActions.primary}
        secondaryActions={mockActions.secondary}
      />
    );

    expect(
      screen.getByRole('button', { name: 'More actions' })
    ).toHaveAttribute('aria-label', 'More actions');
  });

  it('error icon is present in error state', () => {
    const { container } = renderWithProviders(
      <CompactCard title="Error" isError />
    );

    // Check for AlertCircle icon (has text-destructive class)
    const icon = container.querySelector('.text-destructive');
    expect(icon).toBeInTheDocument();
  });
});

// ===================================================================
// COMPACT PADDING TESTS
// ===================================================================

describe('CompactCard - Compact Layout', () => {
  it('uses p-3 padding for compact layout', () => {
    const { container } = renderWithProviders(<CompactCard title="Compact" />);

    const content = container.querySelector('[class*="p-3"]');
    expect(content).toBeInTheDocument();
  });
});
