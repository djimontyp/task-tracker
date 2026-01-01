import { CheckCircle, AlertCircle, XCircle, type LucideIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import { type StatusIndicatorVariant } from '@/shared/tokens';

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
  { title: string; label: string; Icon: LucideIcon; iconClass: string }
> = {
  healthy: {
    title: 'Connected',
    label: 'Connected',
    Icon: CheckCircle,
    iconClass: 'text-semantic-success',
  },
  warning: {
    title: 'Reconnecting',
    label: 'Reconnecting',
    Icon: AlertCircle,
    iconClass: 'text-semantic-warning',
  },
  error: {
    title: 'Disconnected',
    label: 'Disconnected',
    Icon: XCircle,
    iconClass: 'text-destructive',
  },
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
  const { Icon, iconClass } = config;
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
              <Icon className={`h-4 w-4 ${iconClass}`} aria-hidden="true" />
              {showLabel && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {config.label}
                </span>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${iconClass}`} aria-hidden="true" />
            <span>{config.title}</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
