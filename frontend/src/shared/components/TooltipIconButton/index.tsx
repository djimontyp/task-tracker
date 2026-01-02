import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import { cn } from '@/shared/lib/utils';
import { buttons } from '@/shared/tokens';

export interface TooltipIconButtonProps {
  /** Icon element to display */
  icon: ReactNode;
  /** Accessible label for screen readers */
  label: string;
  /** Tooltip text shown on hover */
  tooltip: string;
  /** Click handler (optional if using href) */
  onClick?: () => void;
  /** Link destination (renders as Link instead of Button) */
  href?: string;
  /** Button variant */
  variant?: 'default' | 'ghost' | 'outline';
  /** Additional className */
  className?: string;
  /** Disable button */
  disabled?: boolean;
}

/**
 * TooltipIconButton - Icon button with tooltip wrapper.
 *
 * Provides consistent 44px touch targets (WCAG 2.5.5) and tooltip behavior.
 * Can render as either a button or a link depending on props.
 *
 * @example
 * // As button
 * <TooltipIconButton
 *   icon={<Settings className="h-5 w-5" />}
 *   label="Open settings"
 *   tooltip="Settings"
 *   onClick={() => openSettings()}
 * />
 *
 * // As link
 * <TooltipIconButton
 *   icon={<Settings className="h-5 w-5" />}
 *   label="Open settings"
 *   tooltip="Settings"
 *   href="/settings"
 * />
 */
export function TooltipIconButton({
  icon,
  label,
  tooltip,
  onClick,
  href,
  variant = 'ghost',
  className,
  disabled = false,
}: TooltipIconButtonProps) {
  const baseClasses = cn(
    buttons.icon.default,
    'aspect-square rounded-lg',
    'text-muted-foreground',
    'transition-colors hover:bg-muted hover:text-foreground',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'shrink-0',
    className
  );

  const content = href ? (
    <Link
      to={href}
      aria-label={label}
      className={cn(
        'inline-flex items-center justify-center rounded-lg',
        baseClasses
      )}
    >
      {icon}
    </Link>
  ) : (
    <Button
      variant={variant}
      size="icon"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={baseClasses}
    >
      {icon}
    </Button>
  );

  return (
    <TooltipProvider delayDuration={400} disableHoverableContent>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
