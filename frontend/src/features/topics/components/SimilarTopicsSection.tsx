/**
 * SimilarTopicsSection Component
 *
 * Displays semantically similar topics with similarity scores.
 * Includes merge action for consolidating related topics.
 */

import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Link2, GitMerge, AlertCircle, Sparkles } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/shared/ui'
import { cn } from '@/shared/lib'
import { topicService } from '../api/topicService'
import { providerService } from '@/features/providers/api/providerService'
import { renderTopicIcon } from '../utils/renderIcon'
import type { Topic, SimilarTopic } from '../types'
import { badges } from '@/shared/tokens/patterns'

interface SimilarTopicsSectionProps {
  topic: Topic
  className?: string
  onMergeClick?: (targetTopic: Topic) => void
}

interface SimilarityBadgeProps {
  score: number
  t: (key: string, options?: Record<string, unknown>) => string
}

/**
 * Formats similarity score as percentage with appropriate styling
 */
function SimilarityBadge({ score, t }: SimilarityBadgeProps) {
  const percentage = Math.round(score * 100)

  // Determine badge variant based on score
  const getBadgeStyle = () => {
    if (percentage >= 90) return badges.semantic.success
    if (percentage >= 80) return badges.semantic.info
    return badges.semantic.warning
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={cn('text-xs', getBadgeStyle())}>
            <Link2 className="h-3 w-3" />
            {t('detailPage.similarTopics.percentMatch', { percent: percentage })}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('detailPage.similarTopics.scoreTooltip', { score: (score * 100).toFixed(1) })}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function SimilarTopicsSection({
  topic,
  className,
  onMergeClick,
}: SimilarTopicsSectionProps) {
  const { t } = useTranslation(['topics', 'common'])

  // First, get an active embedding provider
  const { data: providers = [], isLoading: isLoadingProviders } = useQuery({
    queryKey: ['providers', 'active'],
    queryFn: () => providerService.listProviders({ active_only: true }),
    staleTime: 5 * 60 * 1000,
  })

  // Find first active provider that supports embeddings (openai or ollama)
  const embeddingProvider = providers.find(
    (p) => p.is_active && (p.type === 'openai' || p.type === 'ollama')
  )

  // Build search query from topic name and description
  const searchQuery = `${topic.name} ${topic.description || ''}`.trim()

  // Fetch similar topics
  const {
    data: similarTopics = [],
    isLoading: isLoadingSimilar,
    error,
  } = useQuery<SimilarTopic[]>({
    queryKey: ['topics', 'similar', topic.id, embeddingProvider?.id],
    queryFn: () =>
      topicService.getSimilarTopics(
        topic.id,
        searchQuery,
        embeddingProvider!.id,
        5,
        0.7
      ),
    enabled: !!embeddingProvider && searchQuery.length > 0,
    staleTime: 5 * 60 * 1000,
  })

  const isLoading = isLoadingProviders || isLoadingSimilar

  // Don't render if no provider available
  if (!isLoadingProviders && !embeddingProvider) {
    return null
  }

  // Don't render if no similar topics found (after loading)
  if (!isLoading && similarTopics.length === 0 && !error) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">
            {t('detailPage.similarTopics.title', 'Similar Topics')}
          </CardTitle>
        </div>
        <CardDescription>
          {t(
            'detailPage.similarTopics.description',
            'Topics with similar content based on semantic analysis'
          )}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center gap-4 text-muted-foreground py-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm">
              {t(
                'detailPage.similarTopics.error',
                'Failed to load similar topics'
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {similarTopics.map(({ topic: similarTopic, similarity_score }) => (
              <div
                key={similarTopic.id}
                className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                {/* Topic Icon */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${similarTopic.color}20` }}
                >
                  {renderTopicIcon(similarTopic.icon, 'h-5 w-5', similarTopic.color)}
                </div>

                {/* Topic Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/topics/${similarTopic.id}`}
                    className="font-medium hover:underline line-clamp-1"
                  >
                    {similarTopic.name}
                  </Link>
                  {similarTopic.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {similarTopic.description}
                    </p>
                  )}
                </div>

                {/* Similarity Badge */}
                <SimilarityBadge score={similarity_score} t={t} />

                {/* Merge Button */}
                {onMergeClick && similarity_score >= 0.85 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-11"
                          onClick={() => onMergeClick(similarTopic)}
                          aria-label={t(
                            'detailPage.similarTopics.mergeAriaLabel',
                            { name: similarTopic.name }
                          )}
                        >
                          <GitMerge className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {t(
                            'detailPage.similarTopics.mergeTooltip',
                            'Merge this topic'
                          )}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
