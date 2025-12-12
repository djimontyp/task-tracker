/**
 * TopTopics Component
 *
 * Displays top topics ranked by atom count.
 * Adapted from TrendingTopics with updated styling.
 */

import { useNavigate } from 'react-router-dom'
import { Trophy, Flame } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'
import { Button } from '@/shared/ui/button'
import * as LucideIcons from 'lucide-react'
import type { TopTopicsProps, TopTopic } from '../types'

const TopicItem = ({
  topic,
  index,
  onClick,
}: {
  topic: TopTopic
  index: number
  onClick: () => void
}) => {
  const renderIcon = (iconName?: string) => {
    if (!iconName) return <Flame className="h-4 w-4" aria-hidden="true" />

    const IconComponent = LucideIcons[
      iconName as keyof typeof LucideIcons
    ] as React.ComponentType<{ className?: string }>
    if (!IconComponent || typeof IconComponent !== 'function') {
      return <Flame className="h-4 w-4" aria-hidden="true" />
    }

    return <IconComponent className="h-4 w-4" aria-hidden="true" />
  }

  return (
    <div
      role="listitem"
      className="group flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent/50 hover:shadow-sm hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      aria-label={`Перейти до топіка ${topic.name} з ${topic.atomCount} атомами`}
    >
      {/* Topic icon with color */}
      <div
        className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
        style={{ backgroundColor: topic.color || 'hsl(var(--muted))' }}
        aria-hidden="true"
      >
        <div className="text-white text-sm">{renderIcon(topic.icon)}</div>
      </div>

      {/* Topic info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-muted-foreground/50 w-3.5 tabular-nums">
            {index + 1}
          </span>
          <h3 className="text-sm font-semibold text-foreground truncate leading-tight">
            {topic.name}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground leading-tight tabular-nums">
          {topic.atomCount} {topic.atomCount === 1 ? 'атом' : 'атомів'} ·{' '}
          {topic.messageCount} {topic.messageCount === 1 ? 'msg' : 'msgs'}
        </p>
      </div>
    </div>
  )
}

const TopTopicsSkeleton = () => (
  <div className="space-y-2">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
        <Skeleton className="h-9 w-9 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    ))}
  </div>
)

const TopTopicsEmpty = () => (
  <div className="text-center py-8 space-y-4">
    <div className="flex justify-center">
      <div className="rounded-full bg-muted p-4">
        <Trophy className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
    </div>
    <div className="space-y-2">
      <h3 className="font-medium text-sm text-foreground">Немає топіків</h3>
      <p className="text-muted-foreground text-xs max-w-xs mx-auto">
        Топіки з&apos;являться після аналізу повідомлень
      </p>
    </div>
  </div>
)

const TopTopics = ({ data, isLoading, error, limit = 5 }: TopTopicsProps) => {
  const navigate = useNavigate()

  if (error) {
    return (
      <Card className="border-semantic-error/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" aria-hidden="true" />
            Топ топіки
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <div className="text-sm text-muted-foreground">
              Не вдалось завантажити топіки
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              aria-label="Спробувати завантажити знову"
            >
              Спробувати знову
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const displayedTopics = data?.slice(0, limit) || []

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" aria-hidden="true" />
          Топ топіки
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <TopTopicsSkeleton />
        ) : displayedTopics.length === 0 ? (
          <TopTopicsEmpty />
        ) : (
          <div
            className="space-y-2"
            role="list"
            aria-label="Топ топіки за кількістю атомів"
          >
            {displayedTopics.map((topic, index) => (
              <TopicItem
                key={topic.id}
                topic={topic}
                index={index}
                onClick={() => navigate(`/topics/${topic.id}`)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default TopTopics
