/**
 * ScoreIndicator - Visual 5-dot importance score indicator
 *
 * Displays importance score (0-1) as 5 dots with distinct levels:
 * - Critical (5 dots): score >= 0.9
 * - High (4 dots): score >= 0.7
 * - Medium (3 dots): score >= 0.5
 * - Low (2 dots): score >= 0.3
 * - Noise (1 dot): score < 0.3
 *
 * Design: Industrial precision with semantic color coding.
 * WCAG: Label always visible, not color-only indication.
 */

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';

// Score level configuration - names use i18n keys
const SCORE_LEVELS = [
  { id: 'critical', minScore: 0.9, dots: 5, color: 'bg-semantic-error' },
  { id: 'high', minScore: 0.7, dots: 4, color: 'bg-semantic-warning' },
  { id: 'medium', minScore: 0.5, dots: 3, color: 'bg-semantic-info' },
  { id: 'low', minScore: 0.3, dots: 2, color: 'bg-muted-foreground' },
  { id: 'noise', minScore: 0, dots: 1, color: 'bg-muted-foreground/50' },
] as const;

type ScoreLevelId = (typeof SCORE_LEVELS)[number]['id'];

export interface ScoreIndicatorProps {
  /** Importance score from 0 to 1 */
  score: number;
  /** Show text label alongside dots */
  showLabel?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
}

/**
 * Get the level configuration for a given score
 */
function getScoreLevel(score: number) {
  const clampedScore = Math.max(0, Math.min(1, score));
  for (const level of SCORE_LEVELS) {
    if (clampedScore >= level.minScore) {
      return level;
    }
  }
  return SCORE_LEVELS[SCORE_LEVELS.length - 1];
}

const sizeConfig = {
  sm: {
    dot: 'h-1.5 w-1.5',
    gap: 'gap-1',
    text: 'text-xs',
  },
  md: {
    dot: 'h-2 w-2',
    gap: 'gap-1.5',
    text: 'text-sm',
  },
  lg: {
    dot: 'h-2.5 w-2.5',
    gap: 'gap-2',
    text: 'text-base',
  },
};

export const ScoreIndicator = React.forwardRef<HTMLDivElement, ScoreIndicatorProps>(
  ({ score, showLabel = false, size = 'md', className }, ref) => {
    const { t } = useTranslation('messages');
    const level = getScoreLevel(score);
    const config = sizeConfig[size];
    const percentage = Math.round(score * 100);
    const levelName = t(`noise.scoreIndicator.levels.${level.id}`);

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              ref={ref}
              className={cn(
                'inline-flex items-center',
                config.gap,
                className
              )}
              role="meter"
              aria-label={t('noise.scoreIndicator.ariaLabel', { level: levelName, percentage })}
              aria-valuenow={percentage}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              {/* 5 dot indicators */}
              <div className={cn('flex items-center', config.gap)}>
                {Array.from({ length: 5 }, (_, i) => {
                  const isActive = i < level.dots;
                  return (
                    <span
                      key={i}
                      className={cn(
                        'rounded-full transition-all duration-200',
                        config.dot,
                        isActive
                          ? level.color
                          : 'bg-muted/40 dark:bg-muted/20'
                      )}
                    />
                  );
                })}
              </div>

              {/* Optional text label */}
              {showLabel && (
                <span
                  className={cn(
                    'font-medium tracking-tight',
                    config.text,
                    level.dots >= 4
                      ? 'text-semantic-warning'
                      : level.dots >= 3
                        ? 'text-semantic-info'
                        : 'text-muted-foreground'
                  )}
                >
                  {levelName}
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="font-mono">
            <p>
              {levelName}: {percentage}%
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);

ScoreIndicator.displayName = 'ScoreIndicator';

export { SCORE_LEVELS, getScoreLevel };
export type { ScoreLevelId as ScoreLevel };
