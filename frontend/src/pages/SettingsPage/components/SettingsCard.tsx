/**
 * SettingsCard - Compact card for settings page (72px height)
 *
 * Designed for the 3-column settings layout. Shows icon, title,
 * description, status badge, and optional chevron for navigation.
 *
 * @example
 * <SettingsCard
 *   icon={MessageCircle}
 *   title="Telegram"
 *   description="3 channels connected"
 *   status="connected"
 *   onClick={() => openTelegramSheet()}
 * />
 */

import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Switch } from '@/shared/ui/switch';
import { Separator } from '@/shared/ui/separator';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type SettingsCardStatus =
  | 'connected'
  | 'active'
  | 'pending'
  | 'error'
  | 'disabled'
  | 'loading';

export interface SettingsCardProps {
  /** Lucide icon component */
  icon: ComponentType<{ className?: string }>;
  /** Card title */
  title: string;
  /** Tooltip text for title (shown on hover when different from title) */
  titleTooltip?: string;
  /** Brief description or current value */
  description: string;
  /** Current status */
  status?: SettingsCardStatus;
  /** Custom status label */
  statusLabel?: string;
  /** Click handler (shows chevron when provided) */
  onClick?: () => void;
  /** Footer with toggle or action button */
  footer?: {
    type: 'toggle' | 'button';
    label: string;
    checked?: boolean;
    onClick: (e: React.MouseEvent) => void;
  };
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  isError?: boolean;
  /** Error object */
  error?: Error;
  /** Retry handler */
  onRetry?: () => void;
  /** Additional className */
  className?: string;
}

// ═══════════════════════════════════════════════════════════════
// STATUS CONFIGURATION
// ═══════════════════════════════════════════════════════════════

type StatusConfigItem = {
  icon: ComponentType<{ className?: string }>;
  labelKey: string;
  badgeClass: string;
};

const statusConfig: Record<SettingsCardStatus, StatusConfigItem> = {
  connected: {
    icon: CheckCircle,
    labelKey: 'settingsCard.status.connected',
    badgeClass:
      'border-status-connected bg-status-connected/10 text-status-connected',
  },
  active: {
    icon: CheckCircle,
    labelKey: 'settingsCard.status.active',
    badgeClass:
      'border-status-connected bg-status-connected/10 text-status-connected',
  },
  pending: {
    icon: Clock,
    labelKey: 'settingsCard.status.setup',
    badgeClass:
      'border-status-pending bg-status-pending/10 text-status-pending',
  },
  error: {
    icon: XCircle,
    labelKey: 'settingsCard.status.error',
    badgeClass: 'border-destructive bg-destructive/10 text-destructive',
  },
  disabled: {
    icon: AlertCircle,
    labelKey: 'settingsCard.status.disabled',
    badgeClass: 'border-muted-foreground bg-muted text-muted-foreground',
  },
  loading: {
    icon: Loader2,
    labelKey: 'settingsCard.status.loading',
    badgeClass: 'border-muted-foreground bg-muted text-muted-foreground',
  },
};

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function SettingsCard({
  icon: Icon,
  title,
  titleTooltip,
  description,
  status,
  statusLabel,
  onClick,
  footer,
  isLoading = false,
  isError = false,
  error,
  onRetry,
  className,
}: SettingsCardProps) {
  const { t } = useTranslation('settings');

  if (isError) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <div className="space-y-2">
            <p className="text-sm font-medium">{t('settingsCard.error.title')}</p>
            {error && <p className="text-xs text-muted-foreground">{error.message}</p>}
          </div>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('settingsCard.error.retry')}
            </Button>
          )}
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return <SettingsCardSkeleton />;
  }

  const config = status ? statusConfig[status] : null;
  const StatusIcon = config?.icon;
  const isClickable = !!onClick && !footer; // Not clickable if has footer

  const handleCardClick = () => {
    if (isClickable && onClick) {
      onClick();
    }
  };

  return (
    <Card
      className={cn(
        'transition-all duration-200',
        isClickable && [
          'cursor-pointer',
          'hover:bg-accent/50 hover:shadow-md',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'active:scale-[0.99]',
        ],
        className
      )}
      onClick={handleCardClick}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <div className="flex items-center gap-4 p-4">
        {/* Icon container */}
        <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="h-6 w-6 text-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {titleTooltip ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="font-medium text-base mb-1 truncate cursor-help">
                  {title}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{titleTooltip}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="font-medium text-base mb-1 truncate">{title}</div>
          )}
          <div className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </div>
        </div>

        {/* Status + Chevron */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {config && StatusIcon && (
            <Badge
              variant="outline"
              className={cn('flex items-center gap-2 px-3 py-1', config.badgeClass)}
            >
              <StatusIcon
                className={cn(
                  'h-3.5 w-3.5',
                  status === 'loading' && 'animate-spin'
                )}
              />
              <span className="text-xs font-medium">{statusLabel || t(config.labelKey)}</span>
            </Badge>
          )}
          {isClickable && (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Footer with actions */}
      {footer && (
        <>
          <Separator />
          <div className="flex items-center justify-between px-4 py-3">
            {onClick && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
                className="h-11"
              >
                {t('settingsCard.settings')}
              </Button>
            )}
            {!onClick && <div />}
            {footer.type === 'toggle' ? (
              <Switch
                checked={footer.checked}
                onCheckedChange={() => footer.onClick({} as React.MouseEvent)}
                aria-label={footer.label}
              />
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  footer.onClick(e);
                }}
                className="h-11"
              >
                {footer.label}
              </Button>
            )}
          </div>
        </>
      )}
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// SKELETON
// ═══════════════════════════════════════════════════════════════

export function SettingsCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// ADD CARD (dashed placeholder)
// ═══════════════════════════════════════════════════════════════

export interface AddSettingsCardProps {
  /** Button label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Additional className */
  className?: string;
}

export function AddSettingsCard({
  label,
  onClick,
  className,
}: AddSettingsCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer border-dashed border-2',
        'hover:bg-accent/30 hover:border-primary/50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'transition-all duration-200',
        className
      )}
      onClick={onClick}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex items-center justify-center gap-3 p-4 text-muted-foreground hover:text-foreground transition-colors">
        <div className="h-10 w-10 rounded-xl border-2 border-dashed border-current flex items-center justify-center">
          <span className="text-xl font-light">+</span>
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
    </Card>
  );
}
