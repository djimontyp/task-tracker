import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { TruncatedText, TruncatedTitle } from './truncated-text';
import { TooltipProvider } from './tooltip';

// Store original ResizeObserver
const OriginalResizeObserver = window.ResizeObserver;

// Mock ResizeObserver as a class
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(callback: ResizeObserverCallback) {
    // Store callback if needed for testing
  }
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

describe('TruncatedText', () => {

  describe('rendering', () => {
    it('renders text content correctly', () => {
      renderWithTooltip(<TruncatedText text="Hello World" />);
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('renders as span by default', () => {
      renderWithTooltip(<TruncatedText text="Test text" />);
      const element = screen.getByText('Test text');
      expect(element.tagName.toLowerCase()).toBe('span');
    });

    it('renders as specified element type', () => {
      renderWithTooltip(<TruncatedText text="Heading" as="h2" />);
      const element = screen.getByText('Heading');
      expect(element.tagName.toLowerCase()).toBe('h2');
    });

    it('applies custom className', () => {
      renderWithTooltip(<TruncatedText text="Styled" className="custom-class" />);
      const element = screen.getByText('Styled');
      expect(element).toHaveClass('custom-class');
    });
  });

  describe('truncation classes', () => {
    it('applies truncate class for single line', () => {
      renderWithTooltip(<TruncatedText text="Single line" lines={1} />);
      const element = screen.getByText('Single line');
      expect(element).toHaveClass('truncate');
    });

    it('applies line-clamp-2 for two lines', () => {
      renderWithTooltip(<TruncatedText text="Two lines" lines={2} />);
      const element = screen.getByText('Two lines');
      expect(element).toHaveClass('line-clamp-2');
    });

    it('applies line-clamp-3 for three lines', () => {
      renderWithTooltip(<TruncatedText text="Three lines" lines={3} />);
      const element = screen.getByText('Three lines');
      expect(element).toHaveClass('line-clamp-3');
    });
  });

  describe('tooltip behavior', () => {
    it('does not render tooltip when showTooltip is false', () => {
      renderWithTooltip(
        <TruncatedText text="No tooltip text" showTooltip={false} />
      );

      // Text should be rendered directly without Tooltip wrapper
      const element = screen.getByText('No tooltip text');
      expect(element).toBeInTheDocument();
    });

    it('renders without tooltip when text is not truncated', () => {
      // When isTruncated is false (default state before ResizeObserver runs),
      // component should render without tooltip
      renderWithTooltip(<TruncatedText text="Short" />);
      expect(screen.getByText('Short')).toBeInTheDocument();
    });
  });

  describe('ResizeObserver integration', () => {
    it('renders without errors when ResizeObserver is available', () => {
      renderWithTooltip(<TruncatedText text="Observable text" />);
      expect(screen.getByText('Observable text')).toBeInTheDocument();
    });
  });
});

describe('TruncatedTitle', () => {
  it('renders with font-semibold class', () => {
    renderWithTooltip(<TruncatedTitle text="Title Text" />);
    const element = screen.getByText('Title Text');
    expect(element).toHaveClass('font-semibold');
  });

  it('renders as h3 by default', () => {
    renderWithTooltip(<TruncatedTitle text="Default Title" />);
    const element = screen.getByText('Default Title');
    expect(element.tagName.toLowerCase()).toBe('h3');
  });

  it('renders as specified heading level', () => {
    renderWithTooltip(<TruncatedTitle text="H1 Title" level="h1" />);
    const element = screen.getByText('H1 Title');
    expect(element.tagName.toLowerCase()).toBe('h1');
  });

  it('merges custom className with default styles', () => {
    renderWithTooltip(
      <TruncatedTitle text="Styled Title" className="text-primary" />
    );
    const element = screen.getByText('Styled Title');
    expect(element).toHaveClass('font-semibold');
    expect(element).toHaveClass('text-primary');
  });

  it('supports all heading levels', () => {
    const levels = ['h1', 'h2', 'h3', 'h4'] as const;

    levels.forEach((level) => {
      const { container } = renderWithTooltip(
        <TruncatedTitle text={`Level ${level}`} level={level} />
      );
      const heading = container.querySelector(level);
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent(`Level ${level}`);
    });
  });
});

describe('accessibility', () => {
  it('preserves semantic HTML structure', () => {
    renderWithTooltip(<TruncatedText text="Accessible text" as="p" />);
    const element = screen.getByText('Accessible text');
    expect(element.tagName.toLowerCase()).toBe('p');
  });

  it('TruncatedTitle uses proper heading elements', () => {
    renderWithTooltip(<TruncatedTitle text="Heading" level="h2" />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Heading');
  });
});
