/**
 * TruncatedText - Text with automatic tooltip on overflow
 *
 * Displays text with truncation and shows a tooltip when the text
 * is actually truncated. Supports single and multi-line truncation.
 *
 * @example
 * // Single line truncation
 * <TruncatedText text="Very long text that will be truncated" />
 *
 * // Multi-line truncation
 * <TruncatedText text="Long paragraph..." lines={2} />
 *
 * // Without tooltip
 * <TruncatedText text="Short text" showTooltip={false} />
 */

import * as React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import { cn } from '@/shared/lib/utils';

// ===================================================================
// TYPES
// ===================================================================

export interface TruncatedTextProps {
  /** The text content to display */
  text: string;
  /** Number of lines before truncation (1, 2, or 3) */
  lines?: 1 | 2 | 3;
  /** Whether to show tooltip on hover when truncated */
  showTooltip?: boolean;
  /** Additional CSS class for the text element */
  className?: string;
  /** HTML element to render (defaults to span) */
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'div';
  /** Maximum width for tooltip content */
  tooltipMaxWidth?: number;
}

// ===================================================================
// LINE CLAMP CLASSES
// ===================================================================

const lineClampClasses = {
  1: 'truncate', // single line uses truncate for better browser support
  2: 'line-clamp-2',
  3: 'line-clamp-3',
} as const;

// ===================================================================
// COMPONENT
// ===================================================================

export const TruncatedText = React.forwardRef<HTMLElement, TruncatedTextProps>(
  (
    {
      text,
      lines = 1,
      showTooltip = true,
      className,
      as: Element = 'span',
      tooltipMaxWidth = 320,
    },
    ref
  ) => {
    const textRef = React.useRef<HTMLElement>(null);
    const [isTruncated, setIsTruncated] = React.useState(false);

    // Check if text is actually truncated
    React.useEffect(() => {
      const element = textRef.current;
      if (!element) return;

      const checkTruncation = () => {
        if (lines === 1) {
          // For single line, compare scrollWidth to clientWidth
          setIsTruncated(element.scrollWidth > element.clientWidth);
        } else {
          // For multi-line, compare scrollHeight to clientHeight
          setIsTruncated(element.scrollHeight > element.clientHeight);
        }
      };

      // Check on mount and when text changes
      checkTruncation();

      // Re-check on resize
      const resizeObserver = new ResizeObserver(checkTruncation);
      resizeObserver.observe(element);

      return () => resizeObserver.disconnect();
    }, [text, lines]);

    // Merge refs
    const mergedRef = React.useCallback(
      (node: HTMLElement | null) => {
        (textRef as React.MutableRefObject<HTMLElement | null>).current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLElement | null>).current = node;
        }
      },
      [ref]
    );

    const textElement = React.createElement(
      Element,
      {
        ref: mergedRef,
        className: cn(lineClampClasses[lines], className),
      },
      text
    );

    // If tooltip is disabled or text is not truncated, just render the text
    if (!showTooltip || !isTruncated) {
      return textElement;
    }

    // Render with tooltip
    return (
      <Tooltip>
        <TooltipTrigger asChild>{textElement}</TooltipTrigger>
        <TooltipContent
          className="max-w-xs break-words"
          style={{ maxWidth: tooltipMaxWidth }}
        >
          {text}
        </TooltipContent>
      </Tooltip>
    );
  }
);

TruncatedText.displayName = 'TruncatedText';

// ===================================================================
// HELPER: TruncatedTitle (pre-styled for card titles)
// ===================================================================

export interface TruncatedTitleProps extends Omit<TruncatedTextProps, 'as'> {
  /** Title level for semantic HTML */
  level?: 'h1' | 'h2' | 'h3' | 'h4';
}

export const TruncatedTitle = React.forwardRef<HTMLElement, TruncatedTitleProps>(
  ({ level = 'h3', className, ...props }, ref) => {
    return (
      <TruncatedText
        ref={ref}
        as={level}
        className={cn('font-semibold', className)}
        {...props}
      />
    );
  }
);

TruncatedTitle.displayName = 'TruncatedTitle';
