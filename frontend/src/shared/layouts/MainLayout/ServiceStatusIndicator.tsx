import { CheckCircle, AlertCircle, XCircle, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  /** Enable pulse animation for 'healthy' status */
  pulse?: boolean;
}

type StatusConfigItem = {
  titleKey: string;
  labelKey: string;
  Icon: LucideIcon;
  iconClass: string;
};

const statusConfig: Record<StatusIndicatorVariant, StatusConfigItem> = {
  healthy: {
    titleKey: 'serviceStatus.connected',
    labelKey: 'serviceStatus.connected',
    Icon: CheckCircle,
    iconClass: 'text-semantic-success',
  },
  warning: {
    titleKey: 'serviceStatus.reconnecting',
    labelKey: 'serviceStatus.reconnecting',
    Icon: AlertCircle,
    iconClass: 'text-semantic-warning',
  },
  error: {
    titleKey: 'serviceStatus.disconnected',
    labelKey: 'serviceStatus.disconnected',
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
  pulse = false,
}: ServiceStatusIndicatorProps) {
  const { t } = useTranslation();
  const config = statusConfig[status];
  const { Icon, iconClass } = config;
  const title = t(config.titleKey);
  const label = t(config.labelKey);
  const effectiveAriaLabel = ariaLabel ?? title;

  const shouldPulse = pulse && status === 'healthy';

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
              <Icon
                className={`h-4 w-4 ${iconClass} ${shouldPulse ? 'animate-pulse' : ''}`}
                aria-hidden="true"
              />
              {showLabel && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {label}
                </span>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${iconClass}`} aria-hidden="true" />
            <span>{title}</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
