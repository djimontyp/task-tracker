/**
 * TrendsList Component
 *
 * Displays trending keywords/topics for the selected period.
 * Shows keyword, mention count, delta, and related problems if any.
 */

import { TrendingUp, ArrowUp, ArrowDown, Minus, AlertCircle, ChevronRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { cn } from '@/shared/lib'
import type { TrendsListProps, Trend } from '../types'

const TrendItem = ({ trend, index }: { trend: Trend; index: number }) => {
  const getDeltaIcon = () => {
    if (trend.delta > 0) return <ArrowUp className="h-3 w-3" aria-hidden="true" />
    if (trend.delta < 0) return <ArrowDown className="h-3 w-3" aria-hidden="true" />
    return <Minus className="h-3 w-3" aria-hidden="true" />
  }

  const getDeltaColor = () => {
    if (trend.delta > 0) return 'text-semantic-success'
    if (trend.delta < 0) return 'text-semantic-error'
    return 'text-muted-foreground'
  }

  return (
    <div
      className="flex items-center gap-4 p-4 rounded-lg border transition-colors hover:bg-accent/50"
      role="listitem"
    >
      {/* Rank number */}
      <span className="text-lg font-bold text-muted-foreground/50 w-6 tabular-nums">
        {index + 1}
      </span>

      {/* Keyword and meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-foreground truncate">
            {trend.keyword}
          </span>
          {trend.relatedProblems && trend.relatedProblems > 0 && (
            <Badge
              variant="outline"
              className="gap-1 border-semantic-error/50 text-semantic-error bg-semantic-error/10"
            >
              <AlertCircle className="h-3 w-3" aria-hidden="true" />
              {trend.relatedProblems} {trend.relatedProblems === 1 ? 'проблема' : 'проблеми'}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground tabular-nums">
          {trend.count} згадувань
        </p>
      </div>

      {/* Delta indicator */}
      <div
        className={cn('flex items-center gap-1 text-sm font-medium', getDeltaColor())}
        aria-label={`${trend.delta > 0 ? 'Збільшення' : trend.delta < 0 ? 'Зменшення' : 'Без змін'} на ${Math.abs(trend.delta)}`}
      >
        {getDeltaIcon()}
        <span className="tabular-nums">
          {trend.delta > 0 && '+'}
          {trend.delta}
        </span>
      </div>
    </div>
  )
}

const TrendsListSkeleton = () => (
  <div className="space-y-2">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
        <Skeleton className="h-6 w-6" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-4 w-12" />
      </div>
    ))}
  </div>
)

const TrendsListEmpty = () => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <div className="rounded-full bg-muted p-4 mb-4">
      <TrendingUp className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
    </div>
    <h3 className="text-sm font-medium text-foreground mb-1">
      Немає трендів
    </h3>
    <p className="text-sm text-muted-foreground max-w-xs">
      Тренди з&apos;являться після аналізу повідомлень
    </p>
  </div>
)

const TrendsList = ({ data, isLoading, error, onShowAll }: TrendsListProps) => {
  if (error) {
    return (
      <Card className="border-semantic-error/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" aria-hidden="true" />
            Тренди тижня
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Не вдалось завантажити тренди
            </p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Спробувати знову
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" aria-hidden="true" />
          Тренди тижня
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <TrendsListSkeleton />
        ) : !data || data.trends.length === 0 ? (
          <TrendsListEmpty />
        ) : (
          <>
            <div className="space-y-2" role="list" aria-label="Тренди тижня">
              {data.trends.map((trend, index) => (
                <TrendItem key={trend.keyword} trend={trend} index={index} />
              ))}
            </div>
            {onShowAll && (
              <Button
                variant="ghost"
                className="w-full mt-4 justify-between"
                onClick={onShowAll}
              >
                Показати всі тренди
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default TrendsList
