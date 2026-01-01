/**
 * ScoreBreakdown - Expanded breakdown of 4 scoring factors
 *
 * Displays the composition of the importance score:
 * - Content (40%): Message relevance and keywords
 * - Author (20%): Sender authority and history
 * - Temporal (20%): Time-based relevance
 * - Topics (20%): Topic alignment
 *
 * Design: Technical dashboard aesthetic with labeled progress bars.
 * Each factor shows its weighted contribution.
 */

import * as React from 'react';
import { cn } from '@/shared/lib/utils';
import {
  FileText,
  User,
  Clock,
  Tags,
  type LucideIcon,
} from 'lucide-react';

// Factor configuration
const SCORE_FACTORS = [
  {
    id: 'content',
    label: 'Content',
    weight: 40,
    icon: FileText,
    description: 'Message relevance and keywords',
  },
  {
    id: 'author',
    label: 'Author',
    weight: 20,
    icon: User,
    description: 'Sender authority and history',
  },
  {
    id: 'temporal',
    label: 'Temporal',
    weight: 20,
    icon: Clock,
    description: 'Time-based relevance',
  },
  {
    id: 'topics',
    label: 'Topics',
    weight: 20,
    icon: Tags,
    description: 'Topic alignment',
  },
] as const;

type FactorId = (typeof SCORE_FACTORS)[number]['id'];

export interface ScoreFactors {
  content: number;
  author: number;
  temporal: number;
  topics: number;
}

export interface ScoreBreakdownProps {
  /** Individual factor scores (0-1) */
  factors: ScoreFactors;
  /** Show weighted contribution values */
  showWeights?: boolean;
  /** Compact mode - horizontal layout */
  compact?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Get color class based on score value
 */
function getScoreColor(score: number): string {
  if (score >= 0.7) return 'bg-semantic-success';
  if (score >= 0.5) return 'bg-semantic-info';
  if (score >= 0.3) return 'bg-semantic-warning';
  return 'bg-muted-foreground';
}

/**
 * Individual factor row component
 */
interface FactorRowProps {
  icon: LucideIcon;
  label: string;
  score: number;
  weight: number;
  showWeights: boolean;
  compact: boolean;
}

const FactorRow = ({
  icon: Icon,
  label,
  score,
  weight,
  showWeights,
  compact,
}: FactorRowProps) => {
  const percentage = Math.round(score * 100);
  const weightedValue = (score * weight).toFixed(1);
  const colorClass = getScoreColor(score);

  if (compact) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
            <span className="text-xs font-medium">{label}</span>
          </div>
          <span className="text-xs tabular-nums font-mono text-muted-foreground">
            {percentage}%
          </span>
        </div>
        <div
          className="h-1 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label={`${label}: ${percentage}%`}
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={cn('h-full transition-all duration-500', colorClass)}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-4">
      {/* Icon and label */}
      <div className="flex items-center gap-2 w-24 shrink-0">
        <div
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded',
            'bg-muted/50 group-hover:bg-muted transition-colors'
          )}
        >
          <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>

      {/* Progress bar */}
      <div className="flex-1 min-w-0">
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted/50"
          role="progressbar"
          aria-label={`${label}: ${percentage}%`}
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={cn(
              'h-full transition-all duration-500 ease-out',
              colorClass
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Score values */}
      <div className="flex items-center gap-2 shrink-0 tabular-nums font-mono text-sm">
        <span className="w-10 text-right">{percentage}%</span>
        {showWeights && (
          <span className="w-14 text-right text-muted-foreground text-xs">
            +{weightedValue}
          </span>
        )}
      </div>
    </div>
  );
};

export const ScoreBreakdown = React.forwardRef<HTMLDivElement, ScoreBreakdownProps>(
  ({ factors, showWeights = true, compact = false, className }, ref) => {
    // Calculate total weighted score
    const totalScore = SCORE_FACTORS.reduce((sum, factor) => {
      return sum + factors[factor.id] * (factor.weight / 100);
    }, 0);

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border bg-card p-4',
          compact ? 'grid grid-cols-2 gap-4' : 'space-y-4',
          className
        )}
        role="group"
        aria-label="Score breakdown by factor"
      >
        {/* Header - only in non-compact mode */}
        {!compact && (
          <div className="flex items-center justify-between pb-2 border-b">
            <h4 className="text-sm font-semibold tracking-tight">
              Score Breakdown
            </h4>
            {showWeights && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Total:</span>
                <span className="font-mono font-semibold text-foreground">
                  {Math.round(totalScore * 100)}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* Factor rows */}
        {SCORE_FACTORS.map((factor) => (
          <FactorRow
            key={factor.id}
            icon={factor.icon}
            label={factor.label}
            score={factors[factor.id]}
            weight={factor.weight}
            showWeights={showWeights && !compact}
            compact={compact}
          />
        ))}

        {/* Weight legend - only in non-compact mode */}
        {showWeights && !compact && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Weights: Content {SCORE_FACTORS[0].weight}% | Author{' '}
              {SCORE_FACTORS[1].weight}% | Temporal {SCORE_FACTORS[2].weight}% |
              Topics {SCORE_FACTORS[3].weight}%
            </p>
          </div>
        )}
      </div>
    );
  }
);

ScoreBreakdown.displayName = 'ScoreBreakdown';

export { SCORE_FACTORS };
export type { FactorId };
