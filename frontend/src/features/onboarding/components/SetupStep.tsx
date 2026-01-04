import { useTranslation } from 'react-i18next';
import { Check, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib';
import type { SetupStepProps, StepStatus } from '../types/wizard';

/**
 * Status indicator component with icon + text (WCAG compliant)
 */
function StatusIndicator({ status }: { status: StepStatus }) {
  const { t } = useTranslation('onboarding');

  const statusConfig: Record<StepStatus, { variant: 'default' | 'secondary' | 'success' | 'outline'; icon: React.ReactNode; label: string }> = {
    pending: {
      variant: 'secondary',
      icon: null,
      label: t('wizard.status.pending'),
    },
    active: {
      variant: 'default',
      icon: null,
      label: t('wizard.status.active'),
    },
    completed: {
      variant: 'success',
      icon: <Check className="h-3 w-3" />,
      label: t('wizard.status.completed'),
    },
    locked: {
      variant: 'outline',
      icon: <Lock className="h-3 w-3" />,
      label: t('wizard.status.locked'),
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className="gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
}

/**
 * SetupStep - A single step card in the Dashboard setup wizard
 *
 * Features:
 * - Step number badge (top-left corner)
 * - Status indicator with icon + text
 * - Locked overlay for locked status
 * - Touch-friendly (44px targets)
 * - Semantic tokens for colors
 */
export function SetupStep({
  stepNumber,
  title,
  description,
  status,
  icon,
  children,
}: SetupStepProps) {
  const isLocked = status === 'locked';
  const isCompleted = status === 'completed';
  const isActive = status === 'active';

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-200',
        isActive && 'ring-2 ring-primary',
        isCompleted && 'bg-semantic-success/5',
        isLocked && 'opacity-60'
      )}
    >
      {/* Locked overlay */}
      {isLocked && (
        <div
          className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-dropdown flex items-center justify-center"
          aria-hidden="true"
        >
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
      )}

      {/* Step number badge */}
      <div className="absolute top-4 left-4">
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
            isCompleted
              ? 'bg-semantic-success text-semantic-success-foreground'
              : isActive
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {isCompleted ? <Check className="h-4 w-4" /> : stepNumber}
        </div>
      </div>

      <CardHeader className="pt-16 pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-lg',
                isCompleted
                  ? 'bg-semantic-success/10 text-semantic-success'
                  : isActive
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
          </div>
          <StatusIndicator status={status} />
        </div>
      </CardHeader>

      {children && (
        <CardContent className="pt-2">
          <div className="flex justify-end">{children}</div>
        </CardContent>
      )}
    </Card>
  );
}
