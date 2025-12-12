/**
 * RecentInsights Component - Timeline Layout
 *
 * Displays recent important atoms as a vertical timeline.
 * Colored dots indicate atom type for quick visual scanning.
 *
 * Design: Visual Designer audit v3 - Timeline layout
 */

import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  AlertTriangle,
  CheckCircle,
  CircleDot,
  HelpCircle,
  Gem,
  ChevronRight,
  Hash,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { cn } from '@/shared/lib'
import { atom, semantic } from '@/shared/tokens/colors'
import { formatMessageDate } from '@/shared/utils/date'
import type { RecentInsightsProps, RecentInsight } from '../types'

// Atom type configuration with fallback
type AtomConfigItem = {
  icon: typeof AlertTriangle
  label: string
  dotBg: string
  textColor: string
}

// Atom type configuration matching backend AtomType enum
const ATOM_CONFIG: Record<string, AtomConfigItem> = {
  PROBLEM: {
    icon: AlertTriangle,
    label: 'Проблема',
    dotBg: atom.problem.bg,
    textColor: atom.problem.text,
  },
  SOLUTION: {
    icon: CheckCircle,
    label: 'Рішення',
    dotBg: atom.decision.bg,
    textColor: atom.decision.text,
  },
  DECISION: {
    icon: CheckCircle,
    label: 'Рішення',
    dotBg: atom.decision.bg,
    textColor: atom.decision.text,
  },
  QUESTION: {
    icon: HelpCircle,
    label: 'Питання',
    dotBg: atom.question.bg,
    textColor: atom.question.text,
  },
  INSIGHT: {
    icon: Gem,
    label: 'Інсайт',
    dotBg: atom.insight.bg,
    textColor: atom.insight.text,
  },
  PATTERN: {
    icon: Gem,
    label: 'Патерн',
    dotBg: atom.insight.bg,
    textColor: atom.insight.text,
  },
  REQUIREMENT: {
    icon: CircleDot,
    label: 'Вимога',
    dotBg: semantic.info.bg,
    textColor: semantic.info.text,
  },
}

// Fallback for unknown types
const DEFAULT_CONFIG: AtomConfigItem = {
  icon: CircleDot,
  label: 'Атом',
  dotBg: 'bg-muted',
  textColor: 'text-muted-foreground',
}

const TimelineItem = ({
  insight,
  isLast,
  onClick,
}: {
  insight: RecentInsight
  isLast: boolean
  onClick?: () => void
}) => {
  const config = ATOM_CONFIG[insight.type] || DEFAULT_CONFIG
  const Icon = config.icon

  return (
    <div className="relative flex gap-4">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        {/* Dot with icon */}
        <div
          className={cn(
            'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            'ring-4 ring-background',
            config.dotBg
          )}
        >
          <Icon className="h-5 w-5 text-white" aria-hidden="true" />
        </div>
        {/* Connecting line */}
        {!isLast && (
          <div className="w-0.5 flex-1 bg-border" aria-hidden="true" />
        )}
      </div>

      {/* Content card */}
      <div
        className={cn(
          'group flex-1 pb-6',
          !isLast && 'pb-8'
        )}
      >
        <div
          className={cn(
            'rounded-lg border bg-card p-4',
            'transition-all duration-200',
            'hover:shadow-md hover:border-primary/20 cursor-pointer',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
          onClick={onClick}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && onClick) {
              e.preventDefault()
              onClick()
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={`${config.label}: ${insight.title}`}
        >
          {/* Header: Type + Time */}
          <div className="flex items-center justify-between mb-2">
            <span className={cn('text-xs font-semibold uppercase tracking-wide', config.textColor)}>
              {config.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatMessageDate(insight.createdAt)}
            </span>
          </div>

          {/* Title */}
          <h4 className="text-sm font-semibold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {insight.title}
          </h4>

          {/* Content preview */}
          {insight.content && (
            <p className="text-xs text-muted-foreground/90 mb-2 line-clamp-2">
              {insight.content}
            </p>
          )}

          {/* Topic */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Hash className="h-3 w-3" aria-hidden="true" />
            {insight.topicName}
          </div>
        </div>
      </div>
    </div>
  )
}

const TimelineSkeleton = () => (
  <div className="space-y-0">
    {[1, 2, 3].map((i) => (
      <div key={i} className="relative flex gap-4">
        <div className="flex flex-col items-center">
          <Skeleton className="h-10 w-10 rounded-full ring-4 ring-background" />
          {i < 3 && <div className="w-0.5 flex-1 bg-border" />}
        </div>
        <div className="flex-1 pb-8">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-full mb-2" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
    ))}
  </div>
)

const TimelineEmpty = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="rounded-full bg-muted p-4 mb-4">
      <Sparkles className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
    </div>
    <h3 className="text-sm font-medium text-foreground mb-1">
      Поки немає insights
    </h3>
    <p className="text-sm text-muted-foreground max-w-xs">
      AI витягне знання після аналізу повідомлень
    </p>
  </div>
)

const RecentInsights = ({
  data,
  isLoading,
  error,
  onViewAll,
  onInsightClick,
}: RecentInsightsProps) => {
  const navigate = useNavigate()

  const handleInsightClick = (insight: RecentInsight) => {
    if (onInsightClick) {
      onInsightClick(insight)
    } else if (insight.topicId) {
      navigate(`/topics/${insight.topicId}`)
    }
  }

  if (error) {
    return (
      <Card className="border-semantic-error/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
            Останні важливі
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Не вдалось завантажити
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
            Останні важливі
          </CardTitle>
          {onViewAll && data && data.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onViewAll} className="gap-1">
              Всі
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <TimelineSkeleton />
        ) : !data || data.length === 0 ? (
          <TimelineEmpty />
        ) : (
          <div role="feed" aria-label="Останні важливі insights">
            {data.map((insight, index) => (
              <TimelineItem
                key={insight.id}
                insight={insight}
                isLast={index === data.length - 1}
                onClick={() => handleInsightClick(insight)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default RecentInsights
