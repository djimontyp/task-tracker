/**
 * CardWithStatus - Card with icon, title, and status badge
 *
 * A common pattern for displaying entities with their current state.
 * Used in: SourceCard, ProviderCard, AgentCard, etc.
 *
 * @example
 * <CardWithStatus
 *   icon={<BoltIcon />}
 *   title="OpenAI Provider"
 *   description="GPT-4 model access"
 *   status="connected"
 *   statusLabel="Active"
 * />
 */

import type { ReactNode, ComponentType } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Separator } from '@/shared/ui/separator';
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { badges, gap } from '@/shared/tokens';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type StatusType = 'connected' | 'validating' | 'pending' | 'error';

export interface CardWithStatusProps {
  /** Icon component or ReactNode */
  icon: ComponentType<{ className?: string }> | ReactNode;
  /** Card title */
  title: string;
  /** Optional description below title */
  description?: string;
  /** Current status */
  status: StatusType;
  /** Optional custom status label (defaults to status name) */
  statusLabel?: string;
  /** Optional footer content (buttons, switches) */
  footer?: ReactNode;
  /** Optional additional content in card body */
  children?: ReactNode;
  /** Additional card className */
  className?: string;
  /** Make card interactive (hover effects) */
  interactive?: boolean;
  /** Click handler for interactive cards */
  onClick?: () => void;
}

// ═══════════════════════════════════════════════════════════════
// STATUS CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const statusConfig = {
  connected: {
    icon: CheckCircle,
    label: 'Connected',
    badgeClass: badges.status.connected,
    dotClass: 'bg-status-connected',
  },
  validating: {
    icon: Clock,
    label: 'Validating',
    badgeClass: badges.status.validating,
    dotClass: 'bg-status-validating',
  },
  pending: {
    icon: AlertCircle,
    label: 'Pending',
    badgeClass: badges.status.pending,
    dotClass: 'bg-status-pending',
  },
  error: {
    icon: XCircle,
    label: 'Error',
    badgeClass: badges.status.error,
    dotClass: 'bg-status-error',
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function CardWithStatus({
  icon: IconComponent,
  title,
  description,
  status,
  statusLabel,
  footer,
  children,
  className,
  interactive = false,
  onClick,
}: CardWithStatusProps) {
  const config = statusConfig[status];
  const StatusIcon = config.icon;
  const label = statusLabel || config.label;

  // Determine if icon is a component or ReactNode
  // Note: forwardRef components (like Heroicons) have typeof === 'object' with $$typeof
  const renderIcon = () => {
    const isComponent =
      typeof IconComponent === 'function' ||
      (typeof IconComponent === 'object' &&
        IconComponent !== null &&
        '$$typeof' in IconComponent);

    if (isComponent) {
      const Icon = IconComponent as ComponentType<{ className?: string }>;
      return <Icon className="h-6 w-6 text-primary" />;
    }
    return IconComponent;
  };

  return (
    <Card
      className={cn(
        'flex flex-col h-full',
        interactive && [
          'card-interactive',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        ],
        className
      )}
      onClick={interactive ? onClick : undefined}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? 'button' : undefined}
    >
      <CardHeader className="flex-row items-start gap-4 space-y-0 pb-4">
        {/* Icon container */}
        <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 shrink-0">
          {renderIcon()}
        </div>

        {/* Title and status */}
        <div className="flex-1 min-w-0">
          <div className={cn('flex items-center flex-wrap', gap.sm, 'mb-2')}>
            <h3 className="font-semibold text-lg leading-none truncate">{title}</h3>
            <Badge variant="outline" className={config.badgeClass}>
              <StatusIcon className="h-3.5 w-3.5" />
              {label}
            </Badge>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </CardHeader>

      {/* Optional content */}
      {children && (
        <CardContent className="flex-1 pb-4">
          {children}
        </CardContent>
      )}

      {/* Optional footer */}
      {footer && (
        <>
          <Separator />
          <CardFooter className="pt-4">
            {footer}
          </CardFooter>
        </>
      )}
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Status Badge (standalone)
// ═══════════════════════════════════════════════════════════════

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Badge variant="outline" className={cn(config.badgeClass, className)}>
      <StatusIcon className="h-3.5 w-3.5" />
      {label || config.label}
    </Badge>
  );
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Status Dot (minimal indicator)
// ═══════════════════════════════════════════════════════════════

export interface StatusDotProps {
  status: StatusType;
  className?: string;
  /** Show animated pulse for active states */
  pulse?: boolean;
}

export function StatusDot({ status, className, pulse = false }: StatusDotProps) {
  const config = statusConfig[status];

  return (
    <span className={cn('relative flex h-2 w-2', className)}>
      {pulse && (status === 'connected' || status === 'validating') && (
        <span
          className={cn(
            'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
            config.dotClass
          )}
        />
      )}
      <span className={cn('relative inline-flex rounded-full h-2 w-2', config.dotClass)} />
    </span>
  );
}
