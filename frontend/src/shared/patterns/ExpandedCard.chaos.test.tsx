/**
 * ExpandedCard Chaos Tests
 *
 * Extreme edge cases, null/undefined handling, performance boundaries,
 * and accessibility violations that should be handled gracefully.
 *
 * Philosophy: "If UI breaks, test MUST fail."
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

const mockHeader = (
  <div>
    <h3 className="text-lg font-semibold">Test Header</h3>
  </div>
);

// ===================================================================
// NULL/UNDEFINED HANDLING
// ===================================================================

describe('ExpandedCard - Null/Undefined Props', () => {
  it('handles null header gracefully', () => {
    expect(() => {
      render(<ExpandedCard header={null as unknown as React.ReactNode} />);
    }).toThrow('header is required');
  });

  it('handles undefined header gracefully', () => {
    expect(() => {
      render(<ExpandedCard header={undefined as unknown as React.ReactNode} />);
    }).toThrow('header is required');
  });

  it('handles null metadata', () => {
    render(
      <ExpandedCard header={mockHeader} metadata={null as unknown as DataListItem[]} />
    );

    expect(screen.queryByRole('term')).not.toBeInTheDocument();
  });

  it('handles undefined metadata', () => {
    const { container } = render(
      <ExpandedCard header={mockHeader} metadata={undefined} />
    );

    const dataList = container.querySelector('.grid');
    expect(dataList).not.toBeInTheDocument();
  });

  it('handles empty metadata array', () => {
    const { container } = render(
      <ExpandedCard header={mockHeader} metadata={[]} />
    );

    const dataList = container.querySelector('.grid');
    expect(dataList).not.toBeInTheDocument();
  });

  it('handles null description', () => {
    render(
      <ExpandedCard header={mockHeader} description={null as unknown as string} />
    );

    const { container } = render(<ExpandedCard header={mockHeader} description={null as unknown as string} />);
    const cardContent = container.querySelector('[class*="pt-0"]');
    expect(cardContent).not.toBeInTheDocument();
  });

  it('handles undefined description', () => {
    const { container } = render(
      <ExpandedCard header={mockHeader} description={undefined} />
    );

    const cardContent = container.querySelector('[class*="pt-0"]');
    expect(cardContent).not.toBeInTheDocument();
  });

  it('handles empty string description', () => {
    render(<ExpandedCard header={mockHeader} description="" />);

    expect(screen.queryByText('')).not.toBeInTheDocument();
  });

  it('handles null actions', () => {
    render(<ExpandedCard header={mockHeader} actions={null} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('handles null footer', () => {
    const { container } = render(
      <ExpandedCard header={mockHeader} footer={null} />
    );

    const footer = container.querySelector('.border-t');
    expect(footer).not.toBeInTheDocument();
  });

  it('handles null onClick handler', () => {
    const { container } = render(
      <ExpandedCard header={mockHeader} onClick={null as unknown as () => void} />
    );

    const card = container.firstChild as HTMLElement;
    expect(card).not.toHaveAttribute('role', 'button');
  });

  it('handles null error object', () => {
    render(
      <ExpandedCard header={mockHeader} isError error={null as unknown as Error} />
    );

    expect(screen.getByText('Failed to load content')).toBeInTheDocument();
  });
});

// ===================================================================
// EXTREME STRING LENGTHS
// ===================================================================

describe('ExpandedCard - Extreme String Lengths', () => {
  it('handles very long description (500+ chars)', () => {
    const longDesc = 'Lorem ipsum dolor sit amet. '.repeat(20);
    render(<ExpandedCard header={mockHeader} description={longDesc} />);

    expect(screen.getByText(longDesc)).toBeInTheDocument();
  });

  it('handles description with 10KB+ text', () => {
    const extremeDesc = 'A'.repeat(10000);
    render(<ExpandedCard header={mockHeader} description={extremeDesc} />);

    expect(screen.getByText(extremeDesc)).toBeInTheDocument();
  });

  it('handles description with Unicode characters', () => {
    const unicodeDesc = '🚀 Testing 你好 मस्ते 🎉 Тест أهلا';
    render(<ExpandedCard header={mockHeader} description={unicodeDesc} />);

    expect(screen.getByText(unicodeDesc)).toBeInTheDocument();
  });

  it('handles description with only emojis', () => {
    const emojiDesc = '🚀🎉💻🔥⚡'.repeat(50);
    render(<ExpandedCard header={mockHeader} description={emojiDesc} />);

    expect(screen.getByText(emojiDesc)).toBeInTheDocument();
  });

  it('handles very long error message (5KB+)', () => {
    const longError = new Error('Critical failure: ' + 'E'.repeat(5000));
    render(<ExpandedCard header={mockHeader} isError error={longError} />);

    const errorText = screen.getByText(longError.message);
    expect(errorText).toHaveClass('truncate', `Expected long error message to be truncated`);
  });

  it('handles empty message with 1000+ chars', () => {
    const longMessage = 'No content available for this resource. '.repeat(30);
    render(<ExpandedCard header={mockHeader} isEmpty emptyMessage={longMessage} />);

    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it('handles metadata value with 500+ chars', () => {
    const longValue = 'Value: ' + 'X'.repeat(500);
    const metadata: DataListItem[] = [
      { label: 'Field', value: longValue },
    ];

    render(<ExpandedCard header={mockHeader} metadata={metadata} />);

    expect(screen.getByText(longValue)).toBeInTheDocument();
  });
});

// ===================================================================
// LARGE ARRAYS
// ===================================================================

describe('ExpandedCard - Large Arrays', () => {
  it('handles 100+ metadata items', () => {
    const manyMetadata: DataListItem[] = Array.from({ length: 100 }, (_, i) => ({
      label: `Field ${i}`,
      value: `Value ${i}`,
    }));

    render(<ExpandedCard header={mockHeader} metadata={manyMetadata} />);

    expect(screen.getByText('Field 0')).toBeInTheDocument();
    expect(screen.getByText('Field 99')).toBeInTheDocument();
  });

  it('handles metadata with 500 items without crash', () => {
    const extremeMetadata: DataListItem[] = Array.from({ length: 500 }, (_, i) => ({
      label: `Field ${i}`,
      value: `Value ${i}`,
    }));

    expect(() => {
      render(<ExpandedCard header={mockHeader} metadata={extremeMetadata} />);
    }).not.toThrow();
  });

  it('handles metadata with duplicate labels', () => {
    const duplicateMetadata: DataListItem[] = [
      { label: 'Status', value: 'Active' },
      { label: 'Status', value: 'Pending' },
      { label: 'Status', value: 'Completed' },
    ];

    render(<ExpandedCard header={mockHeader} metadata={duplicateMetadata} />);

    const statusLabels = screen.getAllByText('Status');
    expect(statusLabels.length).toBe(3, `Expected 3 Status labels, found ${statusLabels.length}`);
  });

  it('handles metadata with React node values', () => {
    const complexMetadata: DataListItem[] = Array.from({ length: 20 }, (_, i) => ({
      label: `Badge ${i}`,
      value: <Badge key={i} data-testid={`badge-${i}`}>Value {i}</Badge>,
    }));

    render(<ExpandedCard header={mockHeader} metadata={complexMetadata} />);

    expect(screen.getByTestId('badge-0')).toBeInTheDocument();
    expect(screen.getByTestId('badge-19')).toBeInTheDocument();
  });
});

// ===================================================================
// RAPID USER INTERACTIONS
// ===================================================================

describe('ExpandedCard - Rapid Interactions', () => {
  it('handles rapid click spam (100 clicks)', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<ExpandedCard header={mockHeader} onClick={onClick} />);

    const card = screen.getByRole('button');

    for (let i = 0; i < 100; i++) {
      await user.click(card);
    }

    expect(onClick).toHaveBeenCalledTimes(100, `Expected 100 calls, got ${onClick.mock.calls.length}`);
  });

  it('handles rapid keyboard events', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<ExpandedCard header={mockHeader} onClick={onClick} />);

    const card = screen.getByRole('button');
    card.focus();

    for (let i = 0; i < 50; i++) {
      await user.keyboard('{Enter}');
    }

    expect(onClick).toHaveBeenCalledTimes(50, `Expected 50 calls, got ${onClick.mock.calls.length}`);
  });

  it('handles alternating Enter and Space keys', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<ExpandedCard header={mockHeader} onClick={onClick} />);

    const card = screen.getByRole('button');
    card.focus();

    for (let i = 0; i < 30; i++) {
      await user.keyboard(i % 2 === 0 ? '{Enter}' : ' ');
    }

    expect(onClick).toHaveBeenCalledTimes(30, `Expected 30 calls, got ${onClick.mock.calls.length}`);
  });

  it('handles rapid retry button clicks', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(<ExpandedCard header={mockHeader} isError onRetry={onRetry} />);

    const retryButton = screen.getByRole('button', { name: 'Retry loading content' });

    for (let i = 0; i < 50; i++) {
      await user.click(retryButton);
    }

    expect(onRetry).toHaveBeenCalledTimes(50, `Expected 50 calls, got ${onRetry.mock.calls.length}`);
  });

  it('handles rapid action button clicks', async () => {
    const user = userEvent.setup();
    const actionClick = vi.fn();

    render(
      <ExpandedCard
        header={mockHeader}
        actions={
          <Button onClick={actionClick} aria-label="Settings">
            <Settings />
          </Button>
        }
      />
    );

    const button = screen.getByRole('button', { name: 'Settings' });

    for (let i = 0; i < 50; i++) {
      await user.click(button);
    }

    expect(actionClick).toHaveBeenCalledTimes(50, `Expected 50 calls, got ${actionClick.mock.calls.length}`);
  });
});

// ===================================================================
// PERFORMANCE BOUNDARIES
// ===================================================================

describe('ExpandedCard - Performance Boundaries', () => {
  it('handles deeply nested header React nodes', () => {
    const deepHeader = (
      <div>
        <div>
          <div>
            <div>
              <div>
                <h3>Deep Header</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    render(<ExpandedCard header={deepHeader} />);

    expect(screen.getByText('Deep Header')).toBeInTheDocument();
  });

  it('handles rapid mount/unmount cycles (20 cycles)', () => {
    for (let i = 0; i < 20; i++) {
      const { unmount } = render(
        <ExpandedCard
          header={<h3>Cycle {i}</h3>}
          description={`Description ${i}`}
        />
      );
      unmount();
    }

    expect(true).toBe(true, 'Component survived 20 mount/unmount cycles');
  });

  it('handles footer with complex nested structure', () => {
    const complexFooter = (
      <div>
        <div className="flex gap-4">
          <div>
            <Button>Action 1</Button>
          </div>
          <div>
            <Button>Action 2</Button>
          </div>
          <div>
            <Badge>Status</Badge>
          </div>
        </div>
      </div>
    );

    render(<ExpandedCard header={mockHeader} footer={complexFooter} />);

    expect(screen.getByRole('button', { name: 'Action 1' })).toBeInTheDocument();
  });

  it('handles all props with maximum complexity', () => {
    const metadata: DataListItem[] = Array.from({ length: 50 }, (_, i) => ({
      label: `Field ${i}`,
      value: <Badge key={i}>Value {i}</Badge>,
    }));

    const complexActions = (
      <div className="flex gap-2">
        <Button size="icon" aria-label="Edit"><Settings /></Button>
        <Button size="icon" aria-label="Delete"><Settings /></Button>
      </div>
    );

    const complexFooter = (
      <div className="flex justify-between">
        <span>Footer text</span>
        <Button>View More</Button>
      </div>
    );

    render(
      <ExpandedCard
        header={<h3>Complex Card</h3>}
        description={'Lorem ipsum '.repeat(100)}
        metadata={metadata}
        actions={complexActions}
        footer={complexFooter}
        onClick={() => {}}
        aria-label="Complex card"
        metadataColumns={3}
        metadataDensity="spacious"
      />
    );

    expect(screen.getByText('Complex Card')).toBeInTheDocument();
  });
});

// ===================================================================
// ACCESSIBILITY EDGE CASES
// ===================================================================

describe('ExpandedCard - Accessibility Edge Cases', () => {
  it('handles missing aria-label on clickable card', () => {
    const headerWithText = <h3>Card Title</h3>;
    render(<ExpandedCard header={headerWithText} onClick={() => {}} />);

    const card = screen.getByRole('button');
    expect(card).toBeInTheDocument();
  });

  it('handles conflicting aria-label and header text', () => {
    render(
      <ExpandedCard
        header={<h3>Header Text</h3>}
        onClick={() => {}}
        aria-label="Different Label"
      />
    );

    const card = screen.getByRole('button', { name: 'Different Label' });
    expect(card).toBeInTheDocument();
  });

  it('handles error state aria-live attribute', () => {
    render(<ExpandedCard header={mockHeader} isError />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });

  it('handles empty state role attribute', () => {
    render(<ExpandedCard header={mockHeader} isEmpty />);

    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
  });

  it('handles retry button aria-label', () => {
    render(<ExpandedCard header={mockHeader} isError onRetry={() => {}} />);

    const retryButton = screen.getByRole('button', { name: 'Retry loading content' });
    expect(retryButton).toHaveAttribute('aria-label', 'Retry loading content');
  });

  it('handles icon aria-hidden in error state', () => {
    const { container } = render(<ExpandedCard header={mockHeader} isError />);

    const icon = container.querySelector('[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });

  it('handles icon aria-hidden in empty state', () => {
    const { container } = render(<ExpandedCard header={mockHeader} isEmpty />);

    const icon = container.querySelector('[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });
});

// ===================================================================
// EVENT HANDLER EDGE CASES
// ===================================================================

describe('ExpandedCard - Event Handler Edge Cases', () => {
  it('handles onClick throwing error gracefully', async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const errorHandler = vi.fn(() => {
      throw new Error('Card click failed');
    });

    render(<ExpandedCard header={mockHeader} onClick={errorHandler} />);

    const card = screen.getByRole('button');

    // Click should throw but component should not crash
    try {
      await user.click(card);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Card click failed');
    }

    // Component still renders after error
    expect(screen.getByText('Test Header')).toBeInTheDocument();
    expect(errorHandler).toHaveBeenCalledTimes(1);

    consoleError.mockRestore();
  });

  it('handles onRetry throwing error gracefully', async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const errorRetry = vi.fn(() => {
      throw new Error('Retry failed');
    });

    render(<ExpandedCard header={mockHeader} isError onRetry={errorRetry} />);

    const retryButton = screen.getByRole('button', { name: 'Retry loading content' });

    // Click should throw but component should not crash
    try {
      await user.click(retryButton);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Retry failed');
    }

    // Error state still renders after failed retry
    expect(screen.getByText('Failed to load content')).toBeInTheDocument();
    expect(errorRetry).toHaveBeenCalledTimes(1);

    consoleError.mockRestore();
  });

  it('handles action onClick throwing error gracefully', async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const errorAction = vi.fn(() => {
      throw new Error('Action failed');
    });

    render(
      <ExpandedCard
        header={mockHeader}
        actions={
          <Button onClick={errorAction} aria-label="Error Action">
            <Settings />
          </Button>
        }
      />
    );

    const button = screen.getByRole('button', { name: 'Error Action' });

    // Click should throw but component should not crash
    try {
      await user.click(button);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Action failed');
    }

    // Component still renders after action error
    expect(screen.getByText('Test Header')).toBeInTheDocument();
    expect(errorAction).toHaveBeenCalledTimes(1);

    consoleError.mockRestore();
  });
});

// ===================================================================
// REACT RENDERING EDGE CASES
// ===================================================================

describe('ExpandedCard - React Rendering Edge Cases', () => {
  it('handles header as primitive string', () => {
    render(<ExpandedCard header="Simple Header" />);

    expect(screen.getByText('Simple Header')).toBeInTheDocument();
  });

  it('handles header with React fragments', () => {
    render(
      <ExpandedCard
        header={
          <>
            <h3>Title</h3>
            <p>Subtitle</p>
          </>
        }
      />
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Subtitle')).toBeInTheDocument();
  });

  it('handles description with line breaks', () => {
    const multilineDesc = 'Line 1\nLine 2\nLine 3\nLine 4';
    render(<ExpandedCard header={mockHeader} description={multilineDesc} />);

    expect(screen.getByText(multilineDesc)).toBeInTheDocument();
  });

  it('handles whitespace-only description', () => {
    const whitespaceDesc = '     ';
    render(<ExpandedCard header={mockHeader} description={whitespaceDesc} />);

    expect(screen.getByText(whitespaceDesc)).toBeInTheDocument();
  });

  it('handles footer with array of elements', () => {
    const arrayFooter = [
      <span key="1">Part 1</span>,
      <span key="2">Part 2</span>,
    ];

    render(<ExpandedCard header={mockHeader} footer={arrayFooter} />);

    expect(screen.getByText('Part 1')).toBeInTheDocument();
    expect(screen.getByText('Part 2')).toBeInTheDocument();
  });
});

// ===================================================================
// METADATA CONFIGURATION EDGE CASES
// ===================================================================

describe('ExpandedCard - Metadata Configuration Edge Cases', () => {
  it('handles invalid metadataColumns value', () => {
    const metadata: DataListItem[] = [
      { label: 'Field', value: 'Value' },
    ];

    render(
      <ExpandedCard
        header={mockHeader}
        metadata={metadata}
        metadataColumns={5 as unknown as 1 | 2 | 3}
      />
    );

    expect(screen.getByText('Field')).toBeInTheDocument();
  });

  it('handles metadataColumns=1 with 50 items', () => {
    const metadata: DataListItem[] = Array.from({ length: 50 }, (_, i) => ({
      label: `Field ${i}`,
      value: `Value ${i}`,
    }));

    render(
      <ExpandedCard
        header={mockHeader}
        metadata={metadata}
        metadataColumns={1}
      />
    );

    expect(screen.getByText('Field 0')).toBeInTheDocument();
  });

  it('handles metadataColumns=3 with 100 items', () => {
    const metadata: DataListItem[] = Array.from({ length: 100 }, (_, i) => ({
      label: `Field ${i}`,
      value: `Value ${i}`,
    }));

    render(
      <ExpandedCard
        header={mockHeader}
        metadata={metadata}
        metadataColumns={3}
      />
    );

    expect(screen.getByText('Field 0')).toBeInTheDocument();
    expect(screen.getByText('Field 99')).toBeInTheDocument();
  });

  it('handles invalid metadataDensity value', () => {
    const metadata: DataListItem[] = [
      { label: 'Field', value: 'Value' },
    ];

    render(
      <ExpandedCard
        header={mockHeader}
        metadata={metadata}
        metadataDensity={'ultra-compact' as unknown as 'compact' | 'comfortable' | 'spacious'}
      />
    );

    expect(screen.getByText('Field')).toBeInTheDocument();
  });
});

// ===================================================================
// STATE COMBINATIONS
// ===================================================================

describe('ExpandedCard - State Combinations', () => {
  it('handles both isLoading and isError (loading takes precedence)', () => {
    const { container } = render(
      <ExpandedCard header={mockHeader} isLoading isError />
    );

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0, 'Loading state should take precedence');
  });

  it('handles both isError and isEmpty (error takes precedence)', () => {
    render(
      <ExpandedCard header={mockHeader} isError isEmpty />
    );

    expect(screen.getByText('Failed to load content')).toBeInTheDocument();
    expect(screen.queryByText('No content available')).not.toBeInTheDocument();
  });

  it('handles all boolean flags as true', () => {
    const { container } = render(
      <ExpandedCard header={mockHeader} isLoading isError isEmpty />
    );

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0, 'Loading should render when all flags true');
  });

  it('handles loading state with all other props present', () => {
    const metadata: DataListItem[] = [{ label: 'Field', value: 'Value' }];

    render(
      <ExpandedCard
        header={mockHeader}
        description="Description"
        metadata={metadata}
        actions={<Button>Action</Button>}
        footer={<span>Footer</span>}
        isLoading
      />
    );

    expect(screen.queryByText('Description')).not.toBeInTheDocument();
  });
});

// ===================================================================
// LAYOUT EDGE CASES
// ===================================================================

describe('ExpandedCard - Layout Edge Cases', () => {
  it('handles very long custom className', () => {
    const longClassName = 'class-' + 'name-'.repeat(100);
    const { container } = render(
      <ExpandedCard header={mockHeader} className={longClassName} />
    );

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass(longClassName);
  });

  it('handles className with special characters', () => {
    const specialClassName = 'class_name-test.variant[md]:hover';
    const { container } = render(
      <ExpandedCard header={mockHeader} className={specialClassName} />
    );

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass(specialClassName);
  });

  it('handles responsive classes in className', () => {
    const { container } = render(
      <ExpandedCard
        header={mockHeader}
        className="sm:block md:flex lg:grid xl:hidden"
      />
    );

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('sm:block', 'md:flex', 'lg:grid', 'xl:hidden');
  });
});
