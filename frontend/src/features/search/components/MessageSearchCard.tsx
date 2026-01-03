import { formatDistanceToNow } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Spinner } from '@/shared/ui'
import { cn } from '@/shared/lib'
import { AlertCircle, RefreshCw } from 'lucide-react'
import type { MessageSearchResult } from '../types'

interface MessageSearchCardProps {
  result: MessageSearchResult
  className?: string
  isLoading?: boolean
  isError?: boolean
  error?: Error
  onRetry?: () => void
}

export const MessageSearchCard = ({ result, className, isLoading = false, isError = false, error, onRetry }: MessageSearchCardProps) => {
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
  const { message, similarity_score } = result

  const getInitials = (profileId: string | number | null) => {
    if (!profileId) return 'U'
    return String(profileId).slice(0, 2).toUpperCase()
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch {
      return timestamp
    }
  }

  const formatSimilarity = (score: number) => {
    return `${Math.round(score * 100)}%`
  }

  return (
    <Card
      className={cn('transition-all hover:shadow-md hover:border-primary/50', className)}
      aria-label={`Message from user ${message.telegram_profile_id || message.author_id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(message.telegram_profile_id)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="font-medium text-sm">
                {message.telegram_profile_id || `User ${message.author_id}`}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatTimestamp(message.sent_at)}
              </span>
              <Badge variant="outline" className="text-xs">
                {formatSimilarity(similarity_score)} match
              </Badge>
              {message.classification && (
                <Badge variant="secondary" className="text-xs">
                  {message.classification}
                </Badge>
              )}
            </div>
            <div className="text-sm text-foreground/90 line-clamp-3">
              {message.content}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
