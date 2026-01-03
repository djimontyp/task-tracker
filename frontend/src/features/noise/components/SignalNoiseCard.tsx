/**
 * SignalCard / NoiseCard - Message classification cards
 *
 * Visually distinct cards for signal (important) vs noise (filtered) messages.
 *
 * Signal: Prominent left border, success background tint, Sparkles icon
 * Noise: Muted border, reduced opacity, VolumeX icon
 *
 * Design: Clear visual hierarchy, scannable at a glance.
 * Supports selection for bulk actions.
 */

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';
import { Checkbox } from '@/shared/ui/checkbox';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { ScoreIndicator } from './ScoreIndicator';
import {
  Sparkles,
  VolumeX,
  Clock,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  MoreHorizontal,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

// Base message data structure
export interface MessageData {
  id: string;
  content: string;
  author: string;
  timestamp: Date;
  score: number;
  classification: 'signal' | 'noise';
  topics?: string[];
  isReviewed?: boolean;
}

// Shared props for both card types
interface BaseCardProps {
  message: MessageData;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  expanded?: boolean;
  onToggleExpand?: (id: string) => void;
  className?: string;
  isError?: boolean;
  error?: Error;
  onRetry?: () => void;
}

/**
 * Shared card header component
 */
const CardHeaderContent = ({
  message,
  selected,
  onSelect,
  isSignal,
  t,
}: {
  message: MessageData;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  isSignal: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
}) => {
  const Icon = isSignal ? Sparkles : VolumeX;

  return (
    <div className="flex items-start gap-4">
      {/* Selection checkbox */}
      {onSelect && (
        <Checkbox
          checked={selected}
          onCheckedChange={(checked) =>
            onSelect(message.id, checked as boolean)
          }
          aria-label={t('noise.card.selectMessage', { author: message.author })}
          className="mt-0.5"
        />
      )}

      {/* Icon indicator */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          isSignal
            ? 'bg-semantic-success/10 text-semantic-success'
            : 'bg-muted text-muted-foreground'
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>

      {/* Message metadata */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm">{message.author}</span>
          <ScoreIndicator score={message.score} size="sm" />
          {message.isReviewed && (
            <Badge variant="outline" className="text-xs gap-2">
              <Check className="h-3 w-3" />
              {t('noise.card.reviewed')}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" aria-hidden="true" />
          <time dateTime={message.timestamp.toISOString()}>
            {formatRelativeTime(message.timestamp)}
          </time>
        </div>
      </div>
    </div>
  );
};

/**
 * Format timestamp as relative time
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * SignalCard - For important messages (signal)
 */
export const SignalCard = React.forwardRef<HTMLDivElement, BaseCardProps>(
  (
    {
      message,
      selected,
      onSelect,
      onApprove,
      onReject,
      expanded = false,
      onToggleExpand,
      className,
      isError = false,
      error,
      onRetry,
    },
    ref
  ) => {
    const { t } = useTranslation('messages');

    if (isError) {
      return (
        <Card ref={ref} className={cn('p-4', className)}>
          <CardContent className="p-0">
            <div className="flex flex-col items-center justify-center gap-4 text-center py-6">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div className="space-y-2">
                <p className="text-sm font-medium">{t('noise.card.error.title', 'Failed to load')}</p>
                {error && <p className="text-xs text-muted-foreground">{error.message}</p>}
              </div>
              {onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t('noise.card.error.retry', 'Retry')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    const isExpandable = message.content.length > 200;
    const displayContent = expanded
      ? message.content
      : message.content.slice(0, 200) + (isExpandable ? '...' : '');

    return (
      <Card
        ref={ref}
        className={cn(
          'relative overflow-hidden transition-all duration-200',
          // Signal styling: success border and tint
          'border-l-4 border-l-semantic-success',
          'bg-semantic-success/5 dark:bg-semantic-success/5',
          'hover:shadow-md hover:bg-semantic-success/10',
          selected && 'ring-2 ring-primary ring-offset-2',
          className
        )}
      >
        <CardHeader className="pb-2">
          <CardHeaderContent
            message={message}
            selected={selected}
            onSelect={onSelect}
            isSignal={true}
            t={t}
          />
        </CardHeader>

        <CardContent className="pt-0 space-y-4">
          {/* Message content */}
          <p className="text-sm leading-relaxed">{displayContent}</p>

          {/* Topics */}
          {message.topics && message.topics.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {message.topics.map((topic) => (
                <Badge
                  key={topic}
                  variant="secondary"
                  className="text-xs font-normal"
                >
                  {topic}
                </Badge>
              ))}
            </div>
          )}

          {/* Actions footer */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              {isExpandable && onToggleExpand && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleExpand(message.id)}
                  className="h-11 text-xs"
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-2" />
                      {t('noise.card.less')}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-2" />
                      {t('noise.card.more')}
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {onReject && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReject(message.id)}
                  className="h-11 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="h-3 w-3 mr-2" />
                  {t('noise.card.reject')}
                </Button>
              )}
              {onApprove && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onApprove(message.id)}
                  className="h-11 text-xs"
                >
                  <Check className="h-3 w-3 mr-2" />
                  {t('noise.card.approve')}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

SignalCard.displayName = 'SignalCard';

/**
 * NoiseCard - For filtered messages (noise)
 */
export const NoiseCard = React.forwardRef<HTMLDivElement, BaseCardProps>(
  (
    {
      message,
      selected,
      onSelect,
      onApprove,
      onReject,
      expanded = false,
      onToggleExpand,
      className,
      isError = false,
      error,
      onRetry,
    },
    ref
  ) => {
    const { t } = useTranslation('messages');

    if (isError) {
      return (
        <Card ref={ref} className={cn('p-4', className)}>
          <CardContent className="p-0">
            <div className="flex flex-col items-center justify-center gap-4 text-center py-6">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div className="space-y-2">
                <p className="text-sm font-medium">{t('noise.card.error.title', 'Failed to load')}</p>
                {error && <p className="text-xs text-muted-foreground">{error.message}</p>}
              </div>
              {onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t('noise.card.error.retry', 'Retry')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    const isExpandable = message.content.length > 150;
    const displayContent = expanded
      ? message.content
      : message.content.slice(0, 150) + (isExpandable ? '...' : '');

    return (
      <Card
        ref={ref}
        className={cn(
          'relative overflow-hidden transition-all duration-200',
          // Noise styling: muted border and reduced prominence
          'border-l-4 border-l-muted',
          'bg-muted/20 dark:bg-muted/10',
          'opacity-80 hover:opacity-100',
          'hover:shadow-sm',
          selected && 'ring-2 ring-primary ring-offset-2 opacity-100',
          className
        )}
      >
        <CardHeader className="pb-2">
          <CardHeaderContent
            message={message}
            selected={selected}
            onSelect={onSelect}
            isSignal={false}
            t={t}
          />
        </CardHeader>

        <CardContent className="pt-0 space-y-4">
          {/* Message content - more muted */}
          <p className="text-sm leading-relaxed text-muted-foreground">
            {displayContent}
          </p>

          {/* Actions footer - minimal */}
          <div className="flex items-center justify-between pt-2 border-t border-muted/50">
            <div className="flex items-center gap-2">
              {isExpandable && onToggleExpand && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleExpand(message.id)}
                  className="h-11 text-xs text-muted-foreground"
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-2" />
                      {t('noise.card.less')}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-2" />
                      {t('noise.card.more')}
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Dropdown for less common actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11"
                    aria-label={t('noise.card.moreActions')}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onApprove && (
                    <DropdownMenuItem onClick={() => onApprove(message.id)}>
                      <Check className="h-4 w-4 mr-2" />
                      {t('noise.card.markAsSignal')}
                    </DropdownMenuItem>
                  )}
                  {onReject && (
                    <DropdownMenuItem
                      onClick={() => onReject(message.id)}
                      className="text-destructive"
                    >
                      <X className="h-4 w-4 mr-2" />
                      {t('noise.card.confirmAsNoise')}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

NoiseCard.displayName = 'NoiseCard';

/**
 * MessageCard - Auto-selects SignalCard or NoiseCard based on classification
 */
export const MessageCard = React.forwardRef<HTMLDivElement, BaseCardProps>(
  (props, ref) => {
    if (props.message.classification === 'signal') {
      return <SignalCard ref={ref} {...props} />;
    }
    return <NoiseCard ref={ref} {...props} />;
  }
);

MessageCard.displayName = 'MessageCard';

export type { BaseCardProps as MessageCardProps };
