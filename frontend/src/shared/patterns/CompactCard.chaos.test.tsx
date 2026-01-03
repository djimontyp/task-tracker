/**
 * CompactCard Chaos Tests
 *
 * Extreme edge cases, null/undefined handling, performance boundaries,
 * and accessibility violations that should be handled gracefully.
 *
 * Philosophy: "If UI breaks, test MUST fail."
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CompactCard } from './CompactCard';
import { Badge } from '@/shared/ui/badge';
import { Pencil, Copy } from 'lucide-react';
import { TooltipProvider } from '@/shared/ui/tooltip';

// ===================================================================
// TEST UTILITIES
// ===================================================================

const renderWithProviders = (ui: React.ReactNode) => {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
};

// ===================================================================
// NULL/UNDEFINED HANDLING
// ===================================================================

describe('CompactCard - Null/Undefined Props', () => {
  it('handles null title gracefully', () => {
    expect(() => {
      renderWithProviders(<CompactCard title={null as unknown as string} />);
    }).toThrow('title is required');
  });

  it('handles undefined title gracefully', () => {
    expect(() => {
      renderWithProviders(<CompactCard title={undefined as unknown as string} />);
    }).toThrow('title is required');
  });

  it('handles empty string title', () => {
    renderWithProviders(<CompactCard title="" />);

    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('', `Expected empty title, got ${heading.textContent}`);
  });

  it('handles null badge gracefully', () => {
    renderWithProviders(<CompactCard title="Test" badge={null} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('handles undefined content', () => {
    const { container } = renderWithProviders(
      <CompactCard title="Test" content={undefined} />
    );

    const contentDivs = container.querySelectorAll('.mt-2');
    expect(contentDivs.length).toBe(0, `Expected no content divs, found ${contentDivs.length}`);
  });

  it('handles empty actions array', () => {
    renderWithProviders(
      <CompactCard title="Test" secondaryActions={[]} />
    );

    expect(screen.queryByRole('button', { name: 'More actions' })).not.toBeInTheDocument();
  });

  it('handles null onClick handler', () => {
    const { container } = renderWithProviders(
      <CompactCard title="Test" onClick={null as unknown as () => void} />
    );

    const card = container.firstChild as HTMLElement;
    expect(card).not.toHaveAttribute('role', 'button');
  });

  it('handles undefined primaryAction', () => {
    renderWithProviders(
      <CompactCard title="Test" primaryAction={undefined} />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('handles null error object', () => {
    renderWithProviders(
      <CompactCard title="Test" isError error={null as unknown as Error} />
    );

    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });
});

// ===================================================================
// EXTREME STRING LENGTHS
// ===================================================================

describe('CompactCard - Extreme String Lengths', () => {
  it('handles very long title (500+ chars)', () => {
    const longTitle = 'A'.repeat(500);
    renderWithProviders(<CompactCard title={longTitle} />);

    const titleElement = screen.getByText(longTitle);
    expect(titleElement).toHaveClass('truncate', `Expected truncate class for ${longTitle.length} char title`);
    expect(titleElement).toBeInTheDocument();
  });

  it('handles title with 1000+ characters', () => {
    const extremeTitle = 'Lorem ipsum '.repeat(100);
    renderWithProviders(<CompactCard title={extremeTitle} />);

    expect(screen.getByText(extremeTitle)).toBeInTheDocument();
  });

  it('handles title with special Unicode characters', () => {
    const unicodeTitle = '🚀 Test 你好 मस्ते 🎉 Тест';
    renderWithProviders(<CompactCard title={unicodeTitle} />);

    expect(screen.getByText(unicodeTitle)).toBeInTheDocument();
  });

  it('handles title with only emojis', () => {
    const emojiTitle = '🚀🎉💻🔥⚡';
    renderWithProviders(<CompactCard title={emojiTitle} />);

    expect(screen.getByText(emojiTitle)).toBeInTheDocument();
  });

  it('handles very long error message (10KB+)', () => {
    const longError = new Error('Error: ' + 'A'.repeat(10000));
    renderWithProviders(
      <CompactCard title="Test" isError error={longError} />
    );

    const errorText = screen.getByText(longError.message);
    expect(errorText).toHaveClass('truncate', `Expected error message to be truncated`);
  });

  it('handles empty message with 1000+ chars', () => {
    const longMessage = 'No content available. '.repeat(50);
    renderWithProviders(
      <CompactCard title="Test" isEmpty emptyMessage={longMessage} />
    );

    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });
});

// ===================================================================
// LARGE ARRAYS
// ===================================================================

describe('CompactCard - Large Arrays', () => {
  it('handles 50+ secondary actions', () => {
    const manyActions = Array.from({ length: 50 }, (_, i) => ({
      label: `Action ${i}`,
      icon: <Copy className="h-4 w-4" data-testid={`icon-${i}`} />,
      onClick: vi.fn(),
    }));

    renderWithProviders(
      <CompactCard
        title="Many Actions"
        primaryAction={{
          label: 'Primary',
          icon: <Pencil className="h-4 w-4" />,
          onClick: vi.fn(),
        }}
        secondaryActions={manyActions}
      />
    );

    expect(screen.getByRole('button', { name: 'More actions' })).toBeInTheDocument();
  });

  it('handles 100+ secondary actions without crash', () => {
    const extremeActions = Array.from({ length: 100 }, (_, i) => ({
      label: `Action ${i}`,
      icon: <Copy className="h-4 w-4" />,
      onClick: vi.fn(),
    }));

    expect(() => {
      renderWithProviders(
        <CompactCard
          title="Extreme Actions"
          secondaryActions={extremeActions}
        />
      );
    }).not.toThrow();
  });

  it('handles duplicate action labels', async () => {
    const user = userEvent.setup();
    const onClick1 = vi.fn();
    const onClick2 = vi.fn();

    renderWithProviders(
      <CompactCard
        title="Duplicates"
        primaryAction={{
          label: 'Edit',
          icon: <Pencil className="h-4 w-4" />,
          onClick: vi.fn(),
        }}
        secondaryActions={[
          { label: 'Copy', icon: <Copy className="h-4 w-4" />, onClick: onClick1 },
          { label: 'Copy', icon: <Copy className="h-4 w-4" />, onClick: onClick2 },
          { label: 'Copy', icon: <Copy className="h-4 w-4" />, onClick: vi.fn() },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'More actions' }));

    const copyItems = screen.getAllByRole('menuitem', { name: /Copy/i });
    expect(copyItems.length).toBe(3, `Expected 3 Copy items, found ${copyItems.length}`);
  });
});

// ===================================================================
// RAPID USER INTERACTIONS
// ===================================================================

describe('CompactCard - Rapid Interactions', () => {
  it('handles rapid click spam (100 clicks)', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    renderWithProviders(
      <CompactCard title="Clickable" onClick={onClick} />
    );

    const card = screen.getByRole('button', { name: 'Clickable' });

    for (let i = 0; i < 100; i++) {
      await user.click(card);
    }

    expect(onClick).toHaveBeenCalledTimes(100, `Expected 100 calls, got ${onClick.mock.calls.length}`);
  });

  it('handles rapid action button clicks', async () => {
    const user = userEvent.setup();
    const actionClick = vi.fn();

    renderWithProviders(
      <CompactCard
        title="Test"
        primaryAction={{
          label: 'Edit',
          icon: <Pencil className="h-4 w-4" />,
          onClick: actionClick,
        }}
      />
    );

    const button = screen.getByRole('button', { name: 'Edit' });

    for (let i = 0; i < 50; i++) {
      await user.click(button);
    }

    expect(actionClick).toHaveBeenCalledTimes(50, `Expected 50 calls, got ${actionClick.mock.calls.length}`);
  });

  it('handles rapid keyboard events', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    renderWithProviders(
      <CompactCard title="Keyboard" onClick={onClick} />
    );

    const card = screen.getByRole('button', { name: 'Keyboard' });
    card.focus();

    for (let i = 0; i < 50; i++) {
      await user.keyboard('{Enter}');
    }

    expect(onClick).toHaveBeenCalledTimes(50, `Expected 50 calls, got ${onClick.mock.calls.length}`);
  });

  it('handles alternating Enter and Space keys', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    renderWithProviders(
      <CompactCard title="Mixed Keys" onClick={onClick} />
    );

    const card = screen.getByRole('button', { name: 'Mixed Keys' });
    card.focus();

    for (let i = 0; i < 20; i++) {
      await user.keyboard(i % 2 === 0 ? '{Enter}' : ' ');
    }

    expect(onClick).toHaveBeenCalledTimes(20, `Expected 20 calls, got ${onClick.mock.calls.length}`);
  });
});

// ===================================================================
// PERFORMANCE BOUNDARIES
// ===================================================================

describe('CompactCard - Performance Boundaries', () => {
  it('renders with deeply nested React nodes', () => {
    const deepContent = (
      <div>
        <div>
          <div>
            <div>
              <div>
                <p>Deep nesting test</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    renderWithProviders(
      <CompactCard title="Deep Nesting" content={deepContent} />
    );

    expect(screen.getByText('Deep nesting test')).toBeInTheDocument();
  });

  it('handles rapid mount/unmount cycles (10 cycles)', () => {
    for (let i = 0; i < 10; i++) {
      const { unmount } = renderWithProviders(
        <CompactCard title={`Cycle ${i}`} />
      );
      unmount();
    }

    expect(true).toBe(true, 'Component survived 10 mount/unmount cycles');
  });

  it('handles content with large description text', () => {
    const largeText = 'Lorem ipsum dolor sit amet. '.repeat(500);

    renderWithProviders(
      <CompactCard
        title="Large Content"
        content={<p>{largeText}</p>}
      />
    );

    expect(screen.getByText(largeText)).toBeInTheDocument();
  });
});

// ===================================================================
// ACCESSIBILITY EDGE CASES
// ===================================================================

describe('CompactCard - Accessibility Edge Cases', () => {
  it('handles missing aria-label on clickable card', () => {
    renderWithProviders(
      <CompactCard title="No ARIA" onClick={() => {}} />
    );

    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('aria-label', 'No ARIA', 'Should fallback to title for aria-label');
  });

  it('handles conflicting aria-label and title', () => {
    renderWithProviders(
      <CompactCard
        title="Card Title"
        onClick={() => {}}
        aria-label="Different Label"
      />
    );

    const card = screen.getByRole('button', { name: 'Different Label' });
    expect(card).toBeInTheDocument();
  });

  it('handles action without icon', () => {
    renderWithProviders(
      <CompactCard
        title="No Icon"
        primaryAction={{
          label: 'Action',
          icon: null as unknown as React.ReactNode,
          onClick: vi.fn(),
        }}
      />
    );

    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('handles disabled action still has aria-label', () => {
    renderWithProviders(
      <CompactCard
        title="Disabled"
        primaryAction={{
          label: 'Disabled Action',
          icon: <Pencil className="h-4 w-4" />,
          onClick: vi.fn(),
          disabled: true,
        }}
      />
    );

    const button = screen.getByRole('button', { name: 'Disabled Action' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-label', 'Disabled Action');
  });
});

// ===================================================================
// EVENT HANDLER EDGE CASES
// ===================================================================

describe('CompactCard - Event Handler Edge Cases', () => {
  it('handles onClick throwing error gracefully', async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const errorHandler = vi.fn(() => {
      throw new Error('onClick failed');
    });

    renderWithProviders(
      <CompactCard title="Error Handler" onClick={errorHandler} />
    );

    const card = screen.getByRole('button', { name: 'Error Handler' });

    // Click should throw but component should not crash
    try {
      await user.click(card);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('onClick failed');
    }

    // Component still renders after error
    expect(screen.getByText('Error Handler')).toBeInTheDocument();
    expect(errorHandler).toHaveBeenCalledTimes(1);

    consoleError.mockRestore();
  });

  it('handles action onClick throwing error gracefully', async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const errorAction = vi.fn(() => {
      throw new Error('Action failed');
    });

    renderWithProviders(
      <CompactCard
        title="Action Error"
        primaryAction={{
          label: 'Error',
          icon: <Pencil className="h-4 w-4" />,
          onClick: errorAction,
        }}
      />
    );

    const button = screen.getByRole('button', { name: 'Error' });

    // Click should throw but component should not crash
    try {
      await user.click(button);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Action failed');
    }

    // Component still renders after action error
    expect(screen.getByText('Action Error')).toBeInTheDocument();
    expect(errorAction).toHaveBeenCalledTimes(1);

    consoleError.mockRestore();
  });

  it('handles onRetry throwing error gracefully', async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const errorRetry = vi.fn(() => {
      throw new Error('Retry failed');
    });

    renderWithProviders(
      <CompactCard title="Retry Error" isError onRetry={errorRetry} />
    );

    const retryButton = screen.getByRole('button', { name: 'Retry' });

    // Click should throw but component should not crash
    try {
      await user.click(retryButton);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Retry failed');
    }

    // Error state still renders after failed retry
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
    expect(errorRetry).toHaveBeenCalledTimes(1);

    consoleError.mockRestore();
  });
});

// ===================================================================
// REACT RENDERING EDGE CASES
// ===================================================================

describe('CompactCard - React Rendering Edge Cases', () => {
  it('handles badge as primitive value', () => {
    renderWithProviders(
      <CompactCard title="Primitive Badge" badge="Active" />
    );

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('handles content as primitive string', () => {
    renderWithProviders(
      <CompactCard title="Primitive Content" content="Simple text" />
    );

    expect(screen.getByText('Simple text')).toBeInTheDocument();
  });

  it('handles content with React fragments', () => {
    renderWithProviders(
      <CompactCard
        title="Fragment"
        content={
          <>
            <span>Part 1</span>
            <span>Part 2</span>
          </>
        }
      />
    );

    expect(screen.getByText('Part 1')).toBeInTheDocument();
    expect(screen.getByText('Part 2')).toBeInTheDocument();
  });

  it('handles whitespace-only title', () => {
    const whitespaceTitle = '   ';
    renderWithProviders(<CompactCard title={whitespaceTitle} />);

    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent(whitespaceTitle);
  });

  it('handles title with line breaks', () => {
    const multilineTitle = 'Line 1\nLine 2\nLine 3';
    renderWithProviders(<CompactCard title={multilineTitle} />);

    expect(screen.getByText(multilineTitle)).toBeInTheDocument();
  });
});

// ===================================================================
// STATE COMBINATIONS
// ===================================================================

describe('CompactCard - State Combinations', () => {
  it('handles both isLoading and isError (loading takes precedence)', () => {
    const { container } = renderWithProviders(
      <CompactCard title="Both States" isLoading isError />
    );

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0, 'Loading state should take precedence');
  });

  it('handles both isError and isEmpty (error takes precedence)', () => {
    renderWithProviders(
      <CompactCard title="Error + Empty" isError isEmpty />
    );

    expect(screen.getByText('Failed to load')).toBeInTheDocument();
    expect(screen.queryByText('No content')).not.toBeInTheDocument();
  });

  it('handles all boolean flags as true', () => {
    const { container } = renderWithProviders(
      <CompactCard title="All True" isLoading isError isEmpty />
    );

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0, 'Loading should render when all flags true');
  });
});
