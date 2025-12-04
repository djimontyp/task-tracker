import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { FireIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'
import { Button } from '@/shared/ui/button'
import { apiClient } from '@/shared/lib/api/client'
import type { RecentTopicsResponse } from '@/features/topics/types'
import * as HeroIcons from '@heroicons/react/24/outline'

export const TrendingTopics = () => {
  const navigate = useNavigate()

  const { data, isLoading, isError } = useQuery<RecentTopicsResponse>({
    queryKey: ['topics', 'trending'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/topics/recent', {
        params: { limit: 5, period: 'week' }
      })
      return response.data
    },
  })

  const trendingTopics = data?.items || []

  const renderIcon = (iconName?: string) => {
    if (!iconName) return <FireIcon className="h-4 w-4" aria-hidden="true" />

    const IconComponent = HeroIcons[iconName as keyof typeof HeroIcons]
    if (!IconComponent) return <FireIcon className="h-4 w-4" aria-hidden="true" />

    return <IconComponent className="h-4 w-4" aria-hidden="true" />
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowTrendingUpIcon className="h-5 w-5" aria-hidden="true" />
            Trending Topics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-3">
            <div className="text-sm text-muted-foreground">
              Failed to load trending topics
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              aria-label="Retry loading trending topics"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowTrendingUpIcon className="h-5 w-5" aria-hidden="true" />
          Trending Topics
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2" role="list" aria-label="Trending topics" aria-busy={isLoading}>
          {isLoading ? (
            <>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </>
          ) : trendingTopics.length > 0 ? (
            trendingTopics.map((topic, index) => (
              <div
                key={topic.id}
                role="listitem"
                className="group flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent/50 hover:shadow-sm hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                tabIndex={0}
                onClick={() => navigate(`/topics/${topic.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    navigate(`/topics/${topic.id}`)
                  }
                }}
                aria-label={`Navigate to ${topic.name} topic with ${topic.atoms_count} atoms`}
              >
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
                  style={{ backgroundColor: topic.color || 'hsl(var(--topic-default))' }}
                  aria-hidden="true"
                >
                  <div className="text-white text-sm">
                    {renderIcon(topic.icon)}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-muted-foreground/50 w-3.5 tabular-nums">
                      {index + 1}
                    </span>
                    <h3 className="text-sm font-semibold text-foreground truncate leading-tight">
                      {topic.name}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-tight tabular-nums">
                    {topic.atoms_count} {topic.atoms_count === 1 ? 'atom' : 'atoms'} · {topic.message_count} {topic.message_count === 1 ? 'msg' : 'msgs'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 space-y-3">
              <div className="flex justify-center">
                <div className="rounded-full bg-muted p-4">
                  <FireIcon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-medium text-sm text-foreground">No trending topics</h3>
                <p className="text-muted-foreground text-xs max-w-xs mx-auto">
                  Topics will appear here once you have message activity
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
