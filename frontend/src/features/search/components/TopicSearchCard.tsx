import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Spinner } from '@/shared/ui'
import { cn } from '@/shared/lib'
import { AlertCircle, RefreshCw } from 'lucide-react'
import type { TopicSearchResult } from '../types'

interface TopicSearchCardProps {
  result: TopicSearchResult
  className?: string
  isLoading?: boolean
  isError?: boolean
  error?: Error
  onRetry?: () => void
}

export const TopicSearchCard = ({ result, className, isLoading = false, isError = false, error, onRetry }: TopicSearchCardProps) => {
  const navigate = useNavigate()
  const { t } = useTranslation('search')

  if (isError) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div className="space-y-2">
              <p className="text-sm font-medium">{t('card.error.title', 'Failed to load')}</p>
              {error && <p className="text-xs text-muted-foreground">{error.message}</p>}
            </div>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('card.error.retry', 'Retry')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Spinner className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>
    )
  }
  const { topic, similarity_score } = result

  const formatSimilarity = (score: number) => {
    return `${Math.round(score * 100)}%`
  }

  const renderIcon = (icon: string | null) => {
    if (!icon) return <span className="text-2xl">📁</span>
    return <span className="text-2xl">{icon}</span>
  }

  const handleClick = () => {
    navigate(`/topics/${topic.id}`)
  }

  return (
    <Card
      className={cn('transition-all hover:shadow-md hover:border-primary/50 cursor-pointer', className)}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Topic: ${topic.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg" style={{ backgroundColor: topic.color || '#e5e7eb' }}>
            {renderIcon(topic.icon)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="font-semibold text-base truncate">{topic.name}</h3>
              <Badge variant="outline" className="text-xs">
                {formatSimilarity(similarity_score)} match
              </Badge>
            </div>
            {topic.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {topic.description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
