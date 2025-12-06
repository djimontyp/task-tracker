import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import { statusIndicators, type StatusIndicatorVariant } from '@/shared/tokens';

export interface ServiceStatusIndicatorProps {
  /** Current service status */
  status: StatusIndicatorVariant;
  /** Optional custom label for screen readers */
  ariaLabel?: string;
  /** Show text label next to dot (desktop only) */
  showLabel?: boolean;
  /** Custom className for container */
  className?: string;
}

const statusConfig: Record<
  StatusIndicatorVariant,
  { title: string; label: string }
> = {
  healthy: { title: 'Service healthy', label: 'Online' },
  warning: { title: 'Service unstable', label: 'Unstable' },
  error: { title: 'Service offline', label: 'Offline' },
};

/**
 * ServiceStatusIndicator - Displays service health status with dot indicator.
 *
 * Uses semantic design tokens for consistent styling across themes.
 * Includes tooltip for accessibility and additional context.
 *
 * @example
 * <ServiceStatusIndicator status="healthy" />
 * <ServiceStatusIndicator status="warning" showLabel />
 * <ServiceStatusIndicator status="error" showLabel />
 */
export function ServiceStatusIndicator({
  status,
  ariaLabel,
  showLabel = false,
  className,
}: ServiceStatusIndicatorProps) {
  const config = statusConfig[status];
  const effectiveAriaLabel = ariaLabel ?? config.title;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={className}
            role="status"
            aria-label={effectiveAriaLabel}
          >
            <div className="flex items-center gap-2 px-2 py-2 rounded-md">
              <span
                data-testid="status-dot"
                className={statusIndicators[status]}
              />
              {showLabel && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {config.label}
                </span>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.title}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
